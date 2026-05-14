'use client'

import { use, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Guard } from '@/components/Guard'
import { useSession } from '@/components/RoleProvider'
import { StatusBadge, PriorityBadge } from '@/components/Badges'
import { AgentAssistant } from '@/components/tickets/AgentAssistant'
import { supabase } from '@/lib/supabase'
import {
  getTicket,
  getStatusHistory,
  updateTicketStatus,
  deleteTicket,
} from '@/lib/tickets'
import { nextStatuses } from '@/lib/constants'
import { formatDateTime } from '@/lib/format'
import type { Ticket, TicketStatusHistory } from '@/lib/types'

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <Guard>
      <TicketDetailInner id={id} />
    </Guard>
  )
}

function TicketDetailInner({ id }: { id: string }) {
  const router = useRouter()
  const { session } = useSession()
  const isAgent = session?.role === 'agente'

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [history, setHistory] = useState<TicketStatusHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [t, h] = await Promise.all([getTicket(id), getStatusHistory(id)])
      if (!t) {
        setNotFound(true)
        return
      }
      setTicket(t)
      setHistory(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Carga inicial. queueMicrotask saca el setState del cuerpo síncrono del efecto.
  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  // Realtime: el ticket y su historial se actualizan solos.
  useEffect(() => {
    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${id}` },
        () => load(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_status_history',
          filter: `ticket_id=eq.${id}`,
        },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, load])

  async function changeStatus(newStatus: string) {
    if (!ticket) return
    setWorking(true)
    setError(null)
    try {
      await updateTicketStatus(ticket.id, newStatus as Ticket['status'])
      await load() // realtime también lo refresca, pero esto da respuesta inmediata
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado')
    } finally {
      setWorking(false)
    }
  }

  async function handleDelete() {
    if (!ticket) return
    if (!confirm('¿Eliminar este ticket cerrado? Esta acción no se puede deshacer.')) return
    setWorking(true)
    setError(null)
    try {
      await deleteTicket(ticket.id)
      router.push('/tickets')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar (solo se eliminan tickets cerrados)',
      )
      setWorking(false)
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-zinc-400">Cargando ticket…</p>
  }
  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Ticket no encontrado</h2>
        <Link href="/tickets" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          ← Volver a tickets
        </Link>
      </div>
    )
  }
  if (!ticket) return null

  const transitions = nextStatuses(ticket.status)
  const canDelete = ticket.status === 'Cerrado'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/tickets" className="text-sm text-indigo-600 hover:underline">
        ← Volver a tickets
      </Link>

      {/* Encabezado */}
      <div className="mt-3 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-bold text-zinc-900">{ticket.title}</h1>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{ticket.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Info label="Categoría">{ticket.category}</Info>
          <Info label="Solicitante">{ticket.requester_name}</Info>
          <Info label="Asignado a">{ticket.assigned_to || 'Sin asignar'}</Info>
          <Info label="Creado">{formatDateTime(ticket.created_at)}</Info>
          <Info label="Última actualización">{formatDateTime(ticket.updated_at)}</Info>
          <Info label="ID">
            <span className="font-mono text-xs text-zinc-400">{ticket.id.slice(0, 8)}</span>
          </Info>
        </dl>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Acciones de estado */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Estado del ticket</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Flujo: Abierto → En Progreso → Resuelto → Cerrado. Cada cambio queda registrado en el
          historial automáticamente.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {transitions.length > 0 ? (
            transitions.map((next) => (
              <button
                key={next}
                onClick={() => changeStatus(next)}
                disabled={working}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Marcar como «{next}»
              </button>
            ))
          ) : (
            <span className="text-sm text-zinc-500">
              El ticket está cerrado. No hay más cambios de estado.
            </span>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={working}
              className="ml-auto rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Eliminar ticket
            </button>
          )}
        </div>
        {!canDelete && (
          <p className="mt-2 text-xs text-zinc-400">
            Un ticket solo se puede eliminar cuando está en estado «Cerrado».
          </p>
        )}
      </div>

      {/* Asistente de IA — solo para agentes */}
      {isAgent && (
        <div className="mt-4">
          <AgentAssistant ticket={ticket} />
        </div>
      )}

      {/* Historial de cambios */}
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Historial de cambios de estado</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Sin cambios registrados todavía.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {history.map((entry) => (
              <li key={entry.id} className="flex gap-3 text-sm">
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                <div>
                  <p className="text-zinc-800">
                    {entry.old_status ? (
                      <>
                        <span className="font-medium">{entry.old_status}</span>
                        {' → '}
                        <span className="font-medium">{entry.new_status}</span>
                      </>
                    ) : (
                      <>
                        Ticket creado en estado{' '}
                        <span className="font-medium">{entry.new_status}</span>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDateTime(entry.changed_at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-zinc-800">{children}</dd>
    </div>
  )
}
