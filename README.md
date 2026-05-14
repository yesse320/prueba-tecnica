# Help Desk EduLabs 🎫

Prototipo funcional de un **sistema interno de soporte técnico (Help Desk)** para
EduLabs. Reemplaza la gestión por correo y mensajes sueltos con una herramienta
integrada de tres módulos:

1. **Gestión de tickets** — crear, listar, filtrar, ver detalle, cambiar de estado
   con historial automático y eliminar tickets cerrados.
2. **Asistente de IA** — apoya al usuario al crear el ticket (sugiere categoría,
   prioridad y mejor redacción) y al agente al atenderlo (analiza el sentimiento,
   sugiere una respuesta y responde preguntas libres).
3. **Chat en vivo con IA** — canal de atención en tiempo real: lo atiende un agente
   humano o, si no hay ninguno disponible, el asistente de IA de forma automática.

---

## 🧱 Stack tecnológico

| Capa            | Tecnología                                              |
| --------------- | ------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, React 19, TypeScript)       |
| Estilos         | **Tailwind CSS v4**                                     |
| Base de datos   | **Supabase** (PostgreSQL)                               |
| Tiempo real     | **Supabase Realtime** (`postgres_changes`)              |
| Inteligencia IA | **OpenRouter** — modelo `google/gemini-2.0-flash-exp`   |
| Despliegue      | **Vercel**                                              |

**¿Por qué este stack?** Next.js permite tener el frontend y el backend (route
handlers) en un solo proyecto y desplegarlo en un clic. Supabase aporta la base de
datos *y* el tiempo real sin montar un servidor de websockets aparte. OpenRouter da
acceso a un modelo de IA con una capa gratuita, suficiente para el prototipo.

---

## 📁 Estructura del proyecto

```
prueba-tecnica/
├── supabase/
│   └── schema.sql            # Script para crear toda la base de datos
├── src/
│   ├── app/
│   │   ├── page.tsx          # Inicio: selección de rol + dashboard
│   │   ├── layout.tsx        # Layout raíz (providers + barra de navegación)
│   │   ├── tickets/          # Módulo 1 — Gestión de Tickets
│   │   │   ├── page.tsx      #   listado + filtros
│   │   │   ├── nuevo/        #   crear ticket (con asistente de IA)
│   │   │   └── [id]/         #   detalle, estados, historial, panel de IA
│   │   ├── chat/             # Módulo 3 — Chat en vivo
│   │   │   ├── page.tsx      #   hub de conversaciones
│   │   │   └── [id]/         #   sala de chat en tiempo real
│   │   └── api/ai/           # Módulo 2 — Backend del asistente de IA
│   │       ├── suggest/      #   sugerencias al crear un ticket
│   │       ├── analyze/      #   sentimiento + respuesta sugerida
│   │       ├── ask/          #   preguntas libres del agente
│   │       └── chat/         #   respuestas/sugerencias en el chat en vivo
│   ├── components/           # Componentes de UI (tickets, chat, comunes)
│   └── lib/                  # Lógica: tipos, constantes, acceso a datos, IA
├── .env.example              # Variables de entorno necesarias (sin valores)
└── README.md
```

---

## ✅ Requisitos previos

- **Node.js 20.9+** y npm
- Una cuenta gratuita en **[Supabase](https://supabase.com)**
- Una API key gratuita de **[OpenRouter](https://openrouter.ai/keys)** *(opcional:
  sin ella, el asistente funciona en modo "simulado" con heurísticas)*

---

## 🚀 Instalación paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/yesse320/prueba-tecnica.git
cd prueba-tecnica
npm install
```

### 2. Crear la base de datos en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el panel del proyecto, abre **SQL Editor → New query**.
3. Copia y pega **todo** el contenido de [`supabase/schema.sql`](./supabase/schema.sql)
   y pulsa **Run**.
4. Esto crea las tablas, los triggers de trazabilidad, las políticas de acceso y
   habilita el tiempo real. El script es idempotente (se puede correr varias veces).

### 3. Configurar las variables de entorno

Copia el archivo de ejemplo y complétalo con tus credenciales:

```bash
cp .env.example .env.local
```

```env
# Supabase → Project Settings → Data API / API Keys
NEXT_PUBLIC_SUPABASE_URL=https://<tu-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>

# OpenRouter → https://openrouter.ai/keys  (opcional)
OPENROUTER_API_KEY=<tu_openrouter_api_key>
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Al entrar eliges si ingresas
como **Usuario** o como **Agente** y escribes tu nombre.

> **Tip para probar el flujo completo:** abre la app en dos ventanas (o una normal
> y otra de incógnito). En una entra como **Usuario** y en la otra como **Agente**.

### 5. Scripts disponibles

| Script          | Acción                                  |
| --------------- | --------------------------------------- |
| `npm run dev`   | Servidor de desarrollo                  |
| `npm run build` | Build de producción                     |
| `npm run start` | Servidor de producción (tras el build)  |
| `npm run lint`  | ESLint                                  |

---

## 🕹️ Ejemplos de uso por módulo

### Módulo 1 — Gestión de Tickets

1. Entra como **Usuario** → ve a **Tickets → + Nuevo ticket**.
2. Escribe el título y la descripción (ej. *"No puedo entrar a mi correo, me rechaza
   la contraseña y tengo una reunión en 10 minutos"*).
3. Pulsa **Analizar con IA**: sugiere categoría (*Correo*) y prioridad (*Alta*).
4. Crea el ticket. En el detalle verás el **historial**: *"Ticket creado en estado
   Abierto"*.
5. Entra como **Agente**, abre el ticket y usa los botones de estado:
   `Abierto → En Progreso → Resuelto → Cerrado`. Cada cambio se registra solo.
6. Con el ticket en **Cerrado** aparece el botón **Eliminar ticket** (solo entonces).

### Módulo 2 — Asistente de IA

- **Al crear** (usuario): el botón *Analizar con IA* sugiere categoría, prioridad y
  una redacción más clara del título/descripción, con botones para aplicar cada
  sugerencia.
- **Al atender** (agente): en el detalle del ticket, el panel *Asistente de IA*
  analiza el **sentimiento** (frustrado / neutral / urgente), propone una **respuesta
  inicial** (copiable) y permite **hacerle preguntas libres** al asistente.

### Módulo 3 — Chat en vivo con IA

1. Entra como **Usuario** → **Chat en vivo → Iniciar chat** y escribe un mensaje.
2. Durante ~10 s el sistema *"busca un agente"*:
   - Si un **Agente** abre la conversación y pulsa **Atender**, el chat se conecta en
     tiempo real entre los dos.
   - Si nadie atiende (o el usuario pulsa *"Hablar con la IA ahora"*), el **asistente
     de IA** atiende automáticamente.
3. Cuando un agente atiende, la IA sigue ayudando **en segundo plano**: le sugiere al
   agente la próxima respuesta.
4. Al pulsar **Cerrar**, la conversación queda guardada como registro completo.

---

## 🤖 Sobre la integración de IA

- Todas las llamadas al modelo pasan por **route handlers del servidor**
  (`src/app/api/ai/*`), por lo que la `OPENROUTER_API_KEY` **nunca** llega al
  navegador.
- Si no hay API key o la llamada falla, cada función cae a un **modo "simulado"**
  con heurísticas por palabras clave. La interfaz muestra una etiqueta
  *"Generado por IA"* o *"Modo simulado"* para que siempre sea claro qué se usó.
  Así la demo nunca se queda sin respuesta.

---

## 🌐 Despliegue (Vercel)

1. Sube el repositorio a GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
3. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `OPENROUTER_API_KEY`.
4. **Deploy**.

> **Arranque en frío:** Vercel no duerme los proyectos en su capa gratuita, así que
> no hay tiempo de arranque en frío apreciable. El primer render de cada ruta puede
> tardar un poco más al compilarse bajo demanda.

---

## 📌 Supuestos y decisiones de diseño

Según el enunciado, ante cualquier ambigüedad se toma una decisión y se documenta:

- **Acceso sin autenticación real.** Es un prototipo: al entrar se elige el rol
  (*Usuario* o *Agente*) y un nombre, que se guardan en `localStorage`. No hay
  usuario/contraseña de prueba porque no hay login real; el rol se cambia desde la
  barra superior. En producción esto se reemplazaría por Supabase Auth.
- **Políticas de acceso (RLS) permisivas.** Al no haber login, las tablas tienen RLS
  habilitado con políticas abiertas para la clave `anon`. En producción se
  restringirían por usuario.
- **Flujo de estados lineal.** `Abierto → En Progreso → Resuelto → Cerrado`, sin
  saltos ni retrocesos, tal como indica el enunciado.
- **Historial automático en la base de datos.** Un *trigger* de PostgreSQL registra
  cada cambio de estado (y el alta del ticket); la app no lo hace manualmente.
- **Borrado protegido a nivel de BD.** Otro *trigger* impide eliminar tickets que no
  estén `Cerrado`, además de la validación en la interfaz.
- **Disponibilidad de agentes en el chat.** Como no hay sesiones de agente
  persistentes, "no hay agente disponible" se modela con una espera de ~10 s: si
  ningún agente pulsa *Atender*, la IA toma la conversación automáticamente.
- **Disparo de la IA en el chat.** Para evitar respuestas duplicadas, la respuesta de
  la IA al usuario la dispara el cliente del usuario; la sugerencia para el agente la
  dispara el cliente del agente.

---

## 🗃️ Script de base de datos

Todo el esquema (tablas, triggers, RLS y configuración de Realtime) está en un único
archivo: **[`supabase/schema.sql`](./supabase/schema.sql)**. Cualquier persona puede
levantar el proyecto desde cero ejecutándolo en el SQL Editor de Supabase.

---

## 📦 Dependencias principales

Ver [`package.json`](./package.json). En resumen: `next`, `react`, `react-dom` y
`@supabase/supabase-js`; Tailwind CSS v4, TypeScript y ESLint como dev-dependencies.

---

## 📖 Manual de uso

Para una guía no técnica orientada al usuario final, ver
**[`MANUAL.md`](./MANUAL.md)**.
