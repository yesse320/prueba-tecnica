-- ============================================================
-- Help Desk EduLabs — Esquema de base de datos (PostgreSQL / Supabase)
-- ============================================================
-- Cómo usar:
--   1. Abre tu proyecto en https://supabase.com
--   2. Ve a "SQL Editor" > "New query"
--   3. Pega TODO este archivo y ejecútalo ("Run")
--
-- El script es idempotente: se puede correr varias veces sin error.
-- Crea las tablas, los triggers de trazabilidad y deja el Realtime
-- y las políticas de acceso listos para el prototipo.
-- ============================================================

-- ------------------------------------------------------------
-- 1. MÓDULO 1 — TICKETS
-- ------------------------------------------------------------

create table if not exists public.tickets (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  description     text        not null,
  category        text        not null,
  -- Prioridad para que el agente sepa qué atender primero (Tip del enunciado)
  priority        text        not null default 'Media'
                  check (priority in ('Baja', 'Media', 'Alta')),
  -- Flujo de estados: Abierto -> En Progreso -> Resuelto -> Cerrado
  status          text        not null default 'Abierto'
                  check (status in ('Abierto', 'En Progreso', 'Resuelto', 'Cerrado')),
  requester_name  text        not null,           -- nombre del solicitante
  assigned_to     text,                           -- persona asignada (agente)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Historial de cambios de estado (clave para la trazabilidad)
create table if not exists public.ticket_status_history (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid        not null references public.tickets(id) on delete cascade,
  old_status  text,                               -- null en el alta del ticket
  new_status  text        not null,
  changed_at  timestamptz not null default now()
);

create index if not exists idx_tickets_status   on public.tickets(status);
create index if not exists idx_tickets_category on public.tickets(category);
create index if not exists idx_history_ticket   on public.ticket_status_history(ticket_id);

-- ------------------------------------------------------------
-- 2. MÓDULO 3 — CHAT EN VIVO
-- ------------------------------------------------------------

create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  user_name   text        not null,               -- quién inició el chat
  subject     text,                               -- motivo opcional
  -- esperando: buscando agente | ia: la atiende la IA |
  -- activa: la atiende un agente | cerrada: finalizada
  status      text        not null default 'esperando'
              check (status in ('esperando', 'ia', 'activa', 'cerrada')),
  agent_name  text,                               -- agente que se unió
  created_at  timestamptz not null default now(),
  closed_at   timestamptz
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid        not null references public.conversations(id) on delete cascade,
  -- usuario | agente | ia | sistema
  sender_role      text        not null
                   check (sender_role in ('usuario', 'agente', 'ia', 'sistema')),
  sender_name      text,
  content          text        not null,
  created_at       timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_conversations_status  on public.conversations(status);

-- ------------------------------------------------------------
-- 3. TRIGGERS — TRAZABILIDAD AUTOMÁTICA
-- ------------------------------------------------------------

-- 3.1 Mantener updated_at al día en cada UPDATE de tickets
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

-- 3.2 Registrar automáticamente el historial de cambios de estado.
--     Se dispara al crear el ticket (old_status = null) y cada vez
--     que el estado cambia. El agente no tiene que hacer nada manual.
create or replace function public.log_ticket_status_change()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.ticket_status_history (ticket_id, old_status, new_status)
    values (new.id, null, new.status);
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.ticket_status_history (ticket_id, old_status, new_status)
    values (new.id, old.status, new.status);
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_ticket_status_history on public.tickets;
create trigger trg_ticket_status_history
  after insert or update on public.tickets
  for each row execute function public.log_ticket_status_change();

-- 3.3 Regla de negocio: solo se puede eliminar un ticket si está Cerrado.
--     Se valida también en el front, pero esto lo blinda en la base de datos.
create or replace function public.prevent_delete_unless_closed()
returns trigger as $$
begin
  if (old.status <> 'Cerrado') then
    raise exception 'Solo se pueden eliminar tickets en estado Cerrado (estado actual: %)', old.status;
  end if;
  return old;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_ticket_delete on public.tickets;
create trigger trg_prevent_ticket_delete
  before delete on public.tickets
  for each row execute function public.prevent_delete_unless_closed();

-- ------------------------------------------------------------
-- 4. SEGURIDAD (RLS)
-- ------------------------------------------------------------
-- Este prototipo no usa login real (se elige rol Usuario/Agente al entrar),
-- así que se habilita RLS con políticas permisivas para la clave anon.
-- En un entorno real estas políticas se reemplazarían por reglas por usuario.

alter table public.tickets               enable row level security;
alter table public.ticket_status_history enable row level security;
alter table public.conversations         enable row level security;
alter table public.messages              enable row level security;

drop policy if exists "prototipo_acceso_total" on public.tickets;
create policy "prototipo_acceso_total" on public.tickets
  for all using (true) with check (true);

drop policy if exists "prototipo_acceso_total" on public.ticket_status_history;
create policy "prototipo_acceso_total" on public.ticket_status_history
  for all using (true) with check (true);

drop policy if exists "prototipo_acceso_total" on public.conversations;
create policy "prototipo_acceso_total" on public.conversations
  for all using (true) with check (true);

drop policy if exists "prototipo_acceso_total" on public.messages;
create policy "prototipo_acceso_total" on public.messages
  for all using (true) with check (true);

-- ------------------------------------------------------------
-- 5. REALTIME
-- ------------------------------------------------------------
-- Habilita la replicación en tiempo real para que el chat y el
-- listado de tickets se actualicen sin recargar la página.
do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ticket_status_history;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- ------------------------------------------------------------
-- 6. DATOS DE EJEMPLO (opcional — útil para la demo)
-- ------------------------------------------------------------
-- Descomenta este bloque si quieres arrancar con tickets de prueba.
--
-- insert into public.tickets (title, description, category, priority, status, requester_name, assigned_to)
-- values
--   ('No puedo iniciar sesión en el correo', 'Desde esta mañana el correo me rechaza la contraseña y tengo una reunión urgente.', 'Correo', 'Alta', 'Abierto', 'Laura Gómez', 'Soporte N1'),
--   ('El proyector de la sala 3 no enciende', 'El proyector no da imagen, ya revisé los cables.', 'Hardware', 'Media', 'En Progreso', 'Andrés Ruiz', 'Soporte N2'),
--   ('Solicitud de instalación de software', 'Necesito que instalen el editor de video en mi equipo.', 'Software', 'Baja', 'Resuelto', 'María Peña', 'Soporte N1');

-- ============================================================
-- Fin del script. ¡Listo para usar!
-- ============================================================
