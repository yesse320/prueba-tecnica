'use client'

// Módulo 3 — Sala de chat en tiempo real.
//
// Flujo:
//  1. El usuario inicia la conversación -> estado "esperando".
//  2. Si un agente se une -> "activa" (atención humana en tiempo real).
//  3. Si pasan ~10 s sin agente (o el usuario lo pide) -> "ia": el
//     asistente de IA atiende automáticamente.
//  4. Con un agente atendiendo, la IA sigue ayudando en segundo plano:
//     le sugiere al agente la próxima respuesta.
//  5. Al cerrar, queda el registro completo del intercambio.
//
// El tiempo real se logra con Supabase Realtime (postgres_changes).

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from '@/components/RoleProvider'
import { ConversationBadge } from '@/components/chat/ConversationBadge'
import { supabase } from '@/lib/supabase'
import {
  getConversation,
  getMessages,
  sendMessage,
  setConversationStatus,
  joinConversation,
} from '@/lib/chat'
import { formatTime, formatDateTime } from '@/lib/format'
import type { Conversation, Message } from '@/lib/types'

const WAIT_SECONDS = 10

export function ChatRoom({ id }: { id: string }) {
  const { session } = useSession()
  const role = session?.role
  const myName = session?.name ?? 'Invitado'

  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS)

  // Sugerencia de la IA para el agente (asistencia en segundo plano).
  const [agentSuggestion, setAgentSuggestion] = useState<string | null>(null)
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const conversationRef = useRef<Conversation | null>(null)
  const processedMsgRef = useRef<string | null>(null) // último mensaje ya procesado por la IA

  // Mantiene una referencia siempre actualizada de la conversación para usarla
  // dentro de callbacks diferidos (setTimeout) sin closures obsoletas.
  useEffect(() => {
    conversationRef.current = conversation
  }, [conversation])

  // ── Carga inicial + función de recarga ────────────────────────────
  const reload = useCallback(async () => {
    try {
      const [c, m] = await Promise.all([getConversation(id), getMessages(id)])
      if (!c) {
        setNotFound(true)
        return
      }
      setConversation(c)
      setMessages(m)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la conversación')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    queueMicrotask(reload)
  }, [reload])

  // ── Realtime: mensajes y estado de la conversación ────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const next = payload.new as Message
            if (prev.some((m) => m.id === next.id)) return prev
            return [...prev, next]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${id}`,
        },
        (payload) => setConversation(payload.new as Conversation),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  // Auto-scroll al último mensaje.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Pasar la conversación a atención por IA ───────────────────────
  const goToAI = useCallback(async () => {
    const current = conversationRef.current
    if (!current || current.status !== 'esperando') return
    try {
      await setConversationStatus(id, 'ia')
      await sendMessage(
        id,
        'sistema',
        null,
        'No hay agentes disponibles en este momento. Te atiende el Asistente de IA. Un agente puede unirse más adelante.',
      )
      setAiThinking(true)
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, mode: 'usuario' }),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar el asistente')
    } finally {
      setAiThinking(false)
    }
  }, [id])

  // Referencia a la última versión de goToAI para el setTimeout de la espera.
  const goToAIRef = useRef(goToAI)
  useEffect(() => {
    goToAIRef.current = goToAI
  }, [goToAI])

  // Cuenta regresiva mientras se busca un agente (lado del usuario).
  // El tiempo restante se calcula contra una fecha límite, así el setState
  // solo ocurre dentro del callback del intervalo (no en el cuerpo del efecto).
  useEffect(() => {
    if (role !== 'usuario' || conversation?.status !== 'esperando') return
    const deadline = Date.now() + WAIT_SECONDS * 1000
    const interval = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    }, 250)
    const timeout = setTimeout(() => goToAIRef.current(), WAIT_SECONDS * 1000)
    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [role, conversation?.status])

  // ── Reacción automática de la IA según quién escribió último ──────
  // El trabajo (setState + fetch) se difiere a un microtask para no llamar
  // a setState de forma síncrona dentro del cuerpo del efecto.
  useEffect(() => {
    if (!conversation) return
    const last = messages[messages.length - 1]
    if (!last || last.id === processedMsgRef.current) return

    // Caso A: la IA atiende al usuario y el usuario acaba de escribir.
    if (
      role === 'usuario' &&
      conversation.status === 'ia' &&
      last.sender_role === 'usuario'
    ) {
      processedMsgRef.current = last.id
      queueMicrotask(() => {
        setAiThinking(true)
        fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id, mode: 'usuario' }),
        })
          .catch(() => setError('El asistente de IA no respondió'))
          .finally(() => setAiThinking(false))
      })
    }

    // Caso B: un agente atiende y la IA le sugiere la próxima respuesta.
    if (
      role === 'agente' &&
      conversation.status === 'activa' &&
      last.sender_role === 'usuario'
    ) {
      processedMsgRef.current = last.id
      queueMicrotask(() => {
        setLoadingSuggestion(true)
        fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: id, mode: 'agente' }),
        })
          .then((r) => r.json())
          .then((d) => setAgentSuggestion(d.suggestion ?? null))
          .catch(() => {})
          .finally(() => setLoadingSuggestion(false))
      })
    }
  }, [messages, conversation, role, id])

  // ── Acciones ──────────────────────────────────────────────────────
  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || !conversation || sending) return
    setSending(true)
    setError(null)
    setAgentSuggestion(null)
    try {
      const senderRole = role === 'agente' ? 'agente' : 'usuario'
      await sendMessage(id, senderRole, myName, text)
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  async function handleJoin() {
    setError(null)
    try {
      await joinConversation(id, myName)
      await sendMessage(id, 'sistema', null, `${myName} (agente) se unió a la conversación.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo unir a la conversación')
    }
  }

  async function handleClose() {
    if (!confirm('¿Cerrar esta conversación? Quedará el registro completo guardado.')) return
    setError(null)
    try {
      await sendMessage(id, 'sistema', null, `Conversación cerrada por ${myName}.`)
      await setConversationStatus(id, 'cerrada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cerrar la conversación')
    }
  }

  // ── Render ────────────────────────────────────────────────────────
  if (loading) {
    return <p className="py-16 text-center text-zinc-400">Cargando conversación…</p>
  }
  if (notFound) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h2 className="text-lg font-semibold text-zinc-900">Conversación no encontrada</h2>
        <Link href="/chat" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
          ← Volver al chat
        </Link>
      </div>
    )
  }
  if (!conversation) return null

  const isClosed = conversation.status === 'cerrada'
  const isAgent = role === 'agente'
  const agentCanJoin =
    isAgent && (conversation.status === 'esperando' || conversation.status === 'ia')
  const canType = !isClosed && (!isAgent || conversation.status === 'activa')

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-3xl flex-col px-4 py-4">
      <Link href="/chat" className="text-sm text-indigo-600 hover:underline">
        ← Volver al chat
      </Link>

      {/* Encabezado de la conversación */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-t-2xl border border-zinc-200 bg-white p-4">
        <div>
          <h1 className="font-semibold text-zinc-900">
            {conversation.subject || 'Conversación de soporte'}
          </h1>
          <p className="text-xs text-zinc-500">
            Usuario: {conversation.user_name}
            {conversation.agent_name && <> · Agente: {conversation.agent_name}</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConversationBadge status={conversation.status} />
          {agentCanJoin && (
            <button
              onClick={handleJoin}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Atender
            </button>
          )}
          {!isClosed && (
            <button
              onClick={handleClose}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Aviso de "buscando agente" para el usuario */}
      {role === 'usuario' && conversation.status === 'esperando' && (
        <div className="flex items-center justify-between gap-2 border-x border-zinc-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <span>Buscando un agente disponible… ({secondsLeft}s)</span>
          <button
            onClick={() => goToAI()}
            className="rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            Hablar con la IA ahora
          </button>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto border-x border-zinc-200 bg-zinc-50 p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            Aún no hay mensajes. {role === 'usuario' ? 'Escribe el primero 👇' : ''}
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} myName={myName} myRole={role} />
            ))}
            {aiThinking && (
              <p className="text-center text-xs text-violet-500">El asistente de IA está escribiendo…</p>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencia de la IA para el agente */}
      {isAgent && conversation.status === 'activa' && (
        <div className="border-x border-zinc-200 bg-violet-50 px-4 py-2 text-sm">
          {loadingSuggestion ? (
            <p className="text-violet-500">🤖 La IA está preparando una sugerencia…</p>
          ) : agentSuggestion ? (
            <div>
              <p className="text-xs font-medium text-violet-700">
                🤖 Sugerencia de la IA (en segundo plano):
              </p>
              <p className="mt-0.5 text-violet-900">{agentSuggestion}</p>
              <button
                onClick={() => {
                  setInput(agentSuggestion)
                  setAgentSuggestion(null)
                }}
                className="mt-1 text-xs font-medium text-violet-600 hover:underline"
              >
                Usar esta sugerencia
              </button>
            </div>
          ) : (
            <p className="text-xs text-violet-500">
              🤖 La IA sugerirá una respuesta cuando el usuario escriba.
            </p>
          )}
        </div>
      )}

      {/* Caja de envío */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 rounded-b-2xl border border-zinc-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!canType || sending}
          placeholder={
            isClosed
              ? 'La conversación está cerrada'
              : !canType
                ? 'Únete a la conversación para responder'
                : 'Escribe un mensaje…'
          }
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-zinc-100"
        />
        <button
          type="submit"
          disabled={!canType || sending || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {isClosed && (
        <p className="mt-2 text-center text-xs text-zinc-400">
          Conversación cerrada{conversation.closed_at && <> el {formatDateTime(conversation.closed_at)}</>}.
          El registro completo queda guardado.
        </p>
      )}
    </div>
  )
}

// ── Burbuja de mensaje ──────────────────────────────────────────────
function MessageBubble({
  message,
  myName,
  myRole,
}: {
  message: Message
  myName: string
  myRole?: string
}) {
  if (message.sender_role === 'sistema') {
    return (
      <p className="text-center text-xs text-zinc-400">— {message.content} —</p>
    )
  }

  // "Mío" = lo escribió esta persona (mismo rol de envío).
  const mine =
    (myRole === 'agente' && message.sender_role === 'agente') ||
    (myRole === 'usuario' && message.sender_role === 'usuario')

  const styles =
    message.sender_role === 'ia'
      ? 'bg-violet-100 text-violet-900'
      : message.sender_role === 'agente'
        ? 'bg-indigo-600 text-white'
        : 'bg-white text-zinc-800 border border-zinc-200'

  const label =
    message.sender_role === 'ia'
      ? '🤖 Asistente IA'
      : message.sender_role === 'agente'
        ? `${message.sender_name ?? 'Agente'} (agente)`
        : (message.sender_name ?? 'Usuario')

  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      <span className="px-1 text-[11px] text-zinc-400">
        {label}
        {message.sender_name === myName && message.sender_role !== 'ia' ? ' · tú' : ''}
      </span>
      <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${styles}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      <span className="px-1 text-[10px] text-zinc-300">{formatTime(message.created_at)}</span>
    </div>
  )
}
