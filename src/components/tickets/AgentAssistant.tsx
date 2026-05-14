'use client'

// Módulo 2.2 — Panel del asistente de IA para el agente, dentro del ticket.
// Analiza el sentimiento, sugiere una respuesta inicial y permite hacerle
// preguntas libres al asistente.

import { useState } from 'react'
import type { Ticket } from '@/lib/types'
import type { TicketAnalysis, AiMode } from '@/lib/ai'

const SENTIMENT_STYLES: Record<string, string> = {
  frustrado: 'bg-red-100 text-red-700',
  urgente: 'bg-amber-100 text-amber-700',
  neutral: 'bg-zinc-100 text-zinc-600',
}

interface QA {
  question: string
  answer: string
  mode: AiMode
}

export function AgentAssistant({ ticket }: { ticket: Ticket }) {
  const [analysis, setAnalysis] = useState<TicketAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [thread, setThread] = useState<QA[]>([])

  async function analyze() {
    setAnalyzing(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: ticket.title,
          description: ticket.description,
          category: ticket.category,
          requester_name: ticket.requester_name,
        }),
      })
      if (!res.ok) throw new Error('El asistente no respondió')
      setAnalysis((await res.json()) as TicketAnalysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al analizar')
    } finally {
      setAnalyzing(false)
    }
  }

  async function ask(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    const q = question.trim()
    setQuestion('')
    setAsking(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket: {
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            status: ticket.status,
          },
          question: q,
        }),
      })
      if (!res.ok) throw new Error('El asistente no respondió')
      const data = (await res.json()) as { answer: string; mode: AiMode }
      setThread((t) => [...t, { question: q, answer: data.answer, mode: data.mode }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al preguntar')
    } finally {
      setAsking(false)
    }
  }

  function copyReply() {
    if (!analysis) return
    navigator.clipboard.writeText(analysis.suggestedReply)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
        🤖 Asistente de IA para el agente
      </h2>
      <p className="mt-0.5 text-xs text-indigo-700/80">
        Analiza el tono del ticket, sugiere una respuesta y resuelve tus dudas.
      </p>

      {/* Análisis: sentimiento + respuesta sugerida */}
      <div className="mt-4">
        {!analysis ? (
          <button
            onClick={analyze}
            disabled={analyzing}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {analyzing ? 'Analizando…' : 'Analizar ticket con IA'}
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-indigo-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-zinc-500">Sentimiento detectado:</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                  SENTIMENT_STYLES[analysis.sentiment] ?? SENTIMENT_STYLES.neutral
                }`}
              >
                {analysis.sentiment}
              </span>
              <ModeTag mode={analysis.mode} />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500">Respuesta sugerida:</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
                {analysis.suggestedReply}
              </p>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={copyReply}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  {copied ? '✓ Copiada' : 'Copiar respuesta'}
                </button>
                <button
                  onClick={analyze}
                  disabled={analyzing}
                  className="text-xs font-medium text-zinc-500 hover:underline disabled:opacity-60"
                >
                  {analyzing ? 'Analizando…' : 'Volver a analizar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preguntas libres al asistente */}
      <div className="mt-4">
        {thread.length > 0 && (
          <div className="mb-3 space-y-3">
            {thread.map((qa, i) => (
              <div key={i} className="rounded-xl border border-indigo-200 bg-white p-3 text-sm">
                <p className="font-medium text-zinc-800">Tú: {qa.question}</p>
                <p className="mt-1 flex items-start gap-2 text-zinc-600">
                  <span>🤖</span>
                  <span className="whitespace-pre-wrap">{qa.answer}</span>
                </p>
                <div className="mt-1">
                  <ModeTag mode={qa.mode} />
                </div>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={ask} className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pregúntale algo al asistente sobre este ticket…"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {asking ? '…' : 'Preguntar'}
          </button>
        </form>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  )
}

function ModeTag({ mode }: { mode: AiMode }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
        mode === 'ia' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {mode === 'ia' ? 'Generado por IA' : 'Modo simulado'}
    </span>
  )
}
