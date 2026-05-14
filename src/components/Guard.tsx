'use client'

// Protege las páginas internas: si no hay "sesión" (rol elegido), invita a
// volver al inicio. Con `agentOnly` restringe una vista a los agentes.

import Link from 'next/link'
import { useSession } from './RoleProvider'

export function Guard({
  children,
  agentOnly = false,
}: {
  children: React.ReactNode
  agentOnly?: boolean
}) {
  const { session, ready } = useSession()

  if (!ready) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-zinc-400">Cargando…</div>
    )
  }

  if (!session) {
    return (
      <Notice
        title="Primero elige cómo ingresar"
        text="Vuelve al inicio y entra como Usuario o como Agente."
      />
    )
  }

  if (agentOnly && session.role !== 'agente') {
    return (
      <Notice
        title="Vista solo para agentes"
        text="Esta sección es del panel de agente. Cambia de rol desde la barra superior si necesitas verla."
      />
    )
  }

  return <>{children}</>
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-4 text-center">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{text}</p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
