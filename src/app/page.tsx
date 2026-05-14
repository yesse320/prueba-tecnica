'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/components/RoleProvider'
import type { AppRole } from '@/lib/types'

export default function HomePage() {
  const { session, ready, signIn } = useSession()

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-zinc-400">
        Cargando…
      </div>
    )
  }

  return session ? <Dashboard /> : <RoleGate onSignIn={signIn} />
}

// ── Pantalla de inicio: selección de rol ────────────────────────────
function RoleGate({ onSignIn }: { onSignIn: (role: AppRole, name: string) => void }) {
  const [role, setRole] = useState<AppRole>('usuario')
  const [name, setName] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSignIn(role, name)
  }

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-4">
      <div className="w-full">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            HD
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Help Desk EduLabs</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Gestión de tickets, asistente de IA y chat en vivo.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              ¿Cómo vas a ingresar?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <RoleOption
                active={role === 'usuario'}
                onClick={() => setRole('usuario')}
                title="Usuario"
                desc="Crear tickets y pedir ayuda"
              />
              <RoleOption
                active={role === 'agente'}
                onClick={() => setRole('agente')}
                title="Agente"
                desc="Atender tickets y chats"
              />
            </div>
          </div>

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Tu nombre
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Laura Gómez"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Entrar al sistema
          </button>

          <p className="text-center text-xs text-zinc-400">
            Prototipo: no se piden contraseñas. El rol se puede cambiar en cualquier momento.
          </p>
        </form>
      </div>
    </div>
  )
}

function RoleOption({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        active
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <span className="block text-sm font-semibold text-zinc-900">{title}</span>
      <span className="mt-0.5 block text-xs text-zinc-500">{desc}</span>
    </button>
  )
}

// ── Dashboard una vez dentro ────────────────────────────────────────
function Dashboard() {
  const { session } = useSession()
  if (!session) return null

  const isAgent = session.role === 'agente'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Hola, {session.name} 👋</h1>
      <p className="mt-1 text-zinc-500">
        {isAgent
          ? 'Panel de agente: atiende tickets y conversaciones de chat.'
          : 'Crea tickets de soporte o inicia un chat en vivo cuando necesites ayuda.'}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ModuleCard
          href="/tickets"
          emoji="🎫"
          title="Gestión de Tickets"
          desc={
            isAgent
              ? 'Revisa, prioriza y actualiza el estado de los tickets. El asistente de IA te sugiere respuestas.'
              : 'Crea un ticket de soporte. El asistente de IA sugiere categoría y prioridad automáticamente.'
          }
          cta={isAgent ? 'Ver bandeja de tickets' : 'Crear / ver mis tickets'}
        />
        <ModuleCard
          href="/chat"
          emoji="💬"
          title="Chat en Vivo con IA"
          desc={
            isAgent
              ? 'Mira las conversaciones activas y únete. La IA te asiste sugiriendo respuestas en segundo plano.'
              : 'Inicia una conversación en tiempo real. Te atiende un agente o, si no hay, el asistente de IA.'
          }
          cta={isAgent ? 'Ver conversaciones' : 'Iniciar un chat'}
        />
      </div>

      <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        <p className="font-medium text-zinc-800">¿Cómo está organizado?</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Módulo 1 – Tickets:</strong> creación, filtros, detalle, cambio de estado con
            historial automático y eliminación solo de tickets cerrados.
          </li>
          <li>
            <strong>Módulo 2 – Asistente de IA:</strong> sugiere categoría/prioridad al crear, y
            analiza sentimiento + propone respuestas al atender.
          </li>
          <li>
            <strong>Módulo 3 – Chat en vivo:</strong> tiempo real con Supabase Realtime, atención
            humana o por IA, y registro persistente de la conversación.
          </li>
        </ul>
      </div>
    </div>
  )
}

function ModuleCard({
  href,
  emoji,
  title,
  desc,
  cta,
}: {
  href: string
  emoji: string
  title: string
  desc: string
  cta: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
    >
      <div className="text-3xl">{emoji}</div>
      <h2 className="mt-3 text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{desc}</p>
      <span className="mt-4 inline-block text-sm font-medium text-indigo-600 group-hover:underline">
        {cta} →
      </span>
    </Link>
  )
}
