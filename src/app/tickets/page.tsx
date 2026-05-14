'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Guard } from '@/components/Guard'
import { useSession } from '@/components/RoleProvider'
import { StatusBadge, PriorityBadge } from '@/components/Badges'
import { supabase } from '@/lib/supabase'
import { listTickets } from '@/lib/tickets'
import { formatDateTime } from '@/lib/format'
import { CATEGORIES, STATUSES, PRIORITY_WEIGHT } from '@/lib/constants'
import type { Status, Category } from '@/lib/constants'
import type { Ticket } from '@/lib/types'

export default function TicketsPage() {
  return (
    <Guard>
      <TicketsInner />
    </Guard>
  )
}

type StatusFilter = Status | 'todos'
type CategoryFilter = Category | 'todas'
type SortBy = 'recientes' | 'prioridad'

function TicketsInner() {
  const { session } = useSession()
  const isAgent = session?.role === 'agente'

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [status, setStatus] = useState<StatusFilter>('todos')
  const [category, setCategory] = useState<CategoryFilter>('todas')
  const [sortBy, setSortBy] = useState<SortBy>(isAgent ? 'prioridad' : 'recientes')

  const load = useCallback(async () => {
    try {
      const data = await listTickets({ status, category })
      setTickets(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los tickets')
    } finally {
      setLoading(false)
    }
  }, [status, category])

  // Carga inicial (y al cambiar los filtros). queueMicrotask saca el setState
  // del cuerpo síncrono del efecto sin retraso perceptible.
  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  // Realtime: cualquier cambio en la tabla refresca el listado.
  useEffect(() => {
    const channel = supabase
      .channel('tickets-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  const visibleTickets = useMemo(() => {
    const copy = [...tickets]
    if (sortBy === 'prioridad') {
      copy.sort((a, b) => {
        const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
        if (byPriority !== 0) return byPriority
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else {
      copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
    }
    return copy
  }, [tickets, sortBy])

  const counts = useMemo(() => {
    return {
      total: tickets.length,
      alta: tickets.filter((t) => t.priority === 'Alta').length,
      abiertos: tickets.filter((t) => t.status === 'Abierto').length,
    }
  }, [tickets])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Tickets de soporte</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {isAgent
              ? 'Bandeja de atención. Los de prioridad Alta van primero.'
              : 'Tus solicitudes de soporte y su estado.'}
          </p>
        </div>
        <Link
          href="/tickets/nuevo"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          + Nuevo ticket
        </Link>
      </div>

      {/* Resumen rápido */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Total" value={counts.total} />
        <StatCard label="Abiertos" value={counts.abiertos} accent="text-blue-600" />
        <StatCard label="Prioridad Alta" value={counts.alta} accent="text-red-600" />
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
        <Field label="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="todos">Todos</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryFilter)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="todas">Todas</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ordenar por">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          >
            <option value="recientes">Más recientes</option>
            <option value="prioridad">Prioridad</option>
          </select>
        </Field>
        {(status !== 'todos' || category !== 'todas') && (
          <button
            onClick={() => {
              setStatus('todos')
              setCategory('todas')
            }}
            className="ml-auto text-sm text-indigo-600 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Listado */}
      <div className="mt-5">
        {loading ? (
          <p className="py-12 text-center text-zinc-400">Cargando tickets…</p>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : visibleTickets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-12 text-center">
            <p className="text-zinc-500">No hay tickets con estos filtros.</p>
            <Link
              href="/tickets/nuevo"
              className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Crear el primer ticket →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-300"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-zinc-900">
                        {ticket.title}
                      </h3>
                      <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600">
                      {ticket.category}
                    </span>
                    <span>Solicita: {ticket.requester_name}</span>
                    <span>Asignado a: {ticket.assigned_to || 'Sin asignar'}</span>
                    <span className="ml-auto">{formatDateTime(ticket.created_at)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent = 'text-zinc-900',
}: {
  label: string
  value: number
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-500">{label}</span>
      {children}
    </label>
  )
}
