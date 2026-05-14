'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Guard } from '@/components/Guard'
import { useSession } from '@/components/RoleProvider'
import { ConversationBadge } from '@/components/chat/ConversationBadge'
import { supabase } from '@/lib/supabase'
import {
  createConversation,
  listConversations,
  listConversationsByUser,
} from '@/lib/chat'
import { formatDateTime } from '@/lib/format'
import type { Conversation } from '@/lib/types'

export default function ChatPage() {
  return (
    <Guard>
      <ChatHub />
    </Guard>
  )
}

function ChatHub() {
  const { session } = useSession()
  const isAgent = session?.role === 'agente'

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session) return
    try {
      setError(null)
      const data = isAgent
        ? await listConversations()
        : await listConversationsByUser(session.name)
      setConversations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las conversaciones')
    } finally {
      setLoading(false)
    }
  }, [session, isAgent])

  // Carga inicial. queueMicrotask saca el setState del cuerpo síncrono del efecto.
  useEffect(() => {
    queueMicrotask(load)
  }, [load])

  // Realtime: el listado se actualiza solo cuando cambia cualquier conversación.
  useEffect(() => {
    const channel = supabase
      .channel('conversations-hub')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => load(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Chat en vivo</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        {isAgent
          ? 'Conversaciones en tiempo real. Únete para atender; la IA te sugiere respuestas.'
          : 'Inicia una conversación. Te atiende un agente o, si no hay, el asistente de IA.'}
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {!isAgent && <StartChat onCreated={load} />}

      <div className="mt-6">
        {loading ? (
          <p className="py-10 text-center text-zinc-400">Cargando…</p>
        ) : isAgent ? (
          <AgentConversationList conversations={conversations} />
        ) : (
          <UserConversationList conversations={conversations} />
        )}
      </div>
    </div>
  )
}

// ── Usuario: iniciar un chat nuevo ──────────────────────────────────
function StartChat({ onCreated }: { onCreated: () => void }) {
  const router = useRouter()
  const { session } = useSession()
  const [subject, setSubject] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    if (!session) return
    setCreating(true)
    setError(null)
    try {
      const convo = await createConversation(session.name, subject.trim() || null)
      onCreated()
      router.push(`/chat/${convo.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el chat')
      setCreating(false)
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5">
      <p className="text-sm font-semibold text-indigo-900">Iniciar una conversación</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="¿Sobre qué necesitas ayuda? (opcional)"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          onClick={start}
          disabled={creating}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {creating ? 'Iniciando…' : 'Iniciar chat'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ── Usuario: lista de mis conversaciones ────────────────────────────
function UserConversationList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-500">
        Aún no tienes conversaciones. Inicia una arriba 👆
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <ConversationRow key={c.id} convo={c} />
      ))}
    </ul>
  )
}

// ── Agente: conversaciones agrupadas por estado ─────────────────────
function AgentConversationList({ conversations }: { conversations: Conversation[] }) {
  const groups = useMemo(() => {
    return {
      atender: conversations.filter(
        (c) => c.status === 'esperando' || c.status === 'ia',
      ),
      activas: conversations.filter((c) => c.status === 'activa'),
      cerradas: conversations.filter((c) => c.status === 'cerrada'),
    }
  }, [conversations])

  return (
    <div className="space-y-6">
      <Group
        title="Por atender"
        hint="Esperando agente o atendidas por la IA — puedes unirte."
        items={groups.atender}
        emptyText="No hay conversaciones esperando."
      />
      <Group
        title="Activas con agente"
        items={groups.activas}
        emptyText="No hay conversaciones activas."
      />
      <Group
        title="Cerradas"
        hint="Registro completo de conversaciones finalizadas."
        items={groups.cerradas}
        emptyText="Todavía no hay conversaciones cerradas."
      />
    </div>
  )
}

function Group({
  title,
  hint,
  items,
  emptyText,
}: {
  title: string
  hint?: string
  items: Conversation[]
  emptyText: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <span className="text-xs text-zinc-400">({items.length})</span>
      </div>
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {items.map((c) => (
            <ConversationRow key={c.id} convo={c} showUser />
          ))}
        </ul>
      )}
    </div>
  )
}

function ConversationRow({
  convo,
  showUser = false,
}: {
  convo: Conversation
  showUser?: boolean
}) {
  return (
    <li>
      <Link
        href={`/chat/${convo.id}`}
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-indigo-300"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">
            {convo.subject || 'Conversación de soporte'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {showUser && <>Usuario: {convo.user_name} · </>}
            {convo.agent_name && <>Agente: {convo.agent_name} · </>}
            {formatDateTime(convo.created_at)}
          </p>
        </div>
        <ConversationBadge status={convo.status} />
      </Link>
    </li>
  )
}
