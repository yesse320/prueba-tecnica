'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Guard } from '@/components/Guard'
import { useSession } from '@/components/RoleProvider'
import { createTicket } from '@/lib/tickets'
import { CATEGORIES, PRIORITIES } from '@/lib/constants'
import type { Category, Priority } from '@/lib/constants'
import type { TicketSuggestion } from '@/lib/ai'

const INPUT_CLASS =
  'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export default function NewTicketPage() {
  return (
    <Guard>
      <NewTicketInner />
    </Guard>
  )
}

function NewTicketInner() {
  const router = useRouter()
  const { session } = useSession()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category | ''>('')
  const [priority, setPriority] = useState<Priority>('Media')
  const [requesterName, setRequesterName] = useState(session?.name ?? '')
  const [assignedTo, setAssignedTo] = useState('')

  const [suggestion, setSuggestion] = useState<TicketSuggestion | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Módulo 2.1: pedirle al asistente que analice el texto ──────────
  async function analyzeWithAI() {
    if (!title.trim() && !description.trim()) {
      setAiError('Escribe al menos un título o una descripción para analizar.')
      return
    }
    setAnalyzing(true)
    setAiError(null)
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error('El asistente no respondió')
      const data = (await res.json()) as TicketSuggestion
      setSuggestion(data)
      // Si aún no se eligió categoría, se aplica la sugerida directamente.
      if (!category) setCategory(data.category)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Error al consultar la IA')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) {
      setSaveError('Selecciona una categoría.')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        requester_name: requesterName.trim() || 'Anónimo',
        assigned_to: assignedTo.trim() || null,
      })
      router.push(`/tickets/${ticket.id}`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo crear el ticket')
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/tickets" className="text-sm text-indigo-600 hover:underline">
        ← Volver a tickets
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">Crear ticket de soporte</h1>
      <p className="mt-0.5 text-sm text-zinc-500">
        Describe tu problema. El asistente de IA puede sugerirte la categoría y la prioridad.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <FormField label="Título" htmlFor="title">
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Resumen corto del problema"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Descripción" htmlFor="description">
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Cuenta con detalle qué pasa, desde cuándo y qué has intentado."
            className={`${INPUT_CLASS} resize-y`}
          />
        </FormField>

        {/* ── Asistente de IA ──────────────────────────────────────── */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-indigo-900">🤖 Asistente de IA</p>
              <p className="text-xs text-indigo-700/80">
                Sugiere categoría, prioridad y una redacción más clara.
              </p>
            </div>
            <button
              type="button"
              onClick={analyzeWithAI}
              disabled={analyzing}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {analyzing ? 'Analizando…' : 'Analizar con IA'}
            </button>
          </div>

          {aiError && <p className="mt-2 text-xs text-red-600">{aiError}</p>}

          {suggestion && (
            <div className="mt-3 space-y-2 border-t border-indigo-200 pt-3 text-sm">
              <p className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded px-1.5 py-0.5 font-medium ${
                    suggestion.mode === 'ia'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {suggestion.mode === 'ia' ? 'Generado por IA' : 'Modo simulado'}
                </span>
              </p>
              <p className="text-indigo-900">
                <strong>Categoría sugerida:</strong> {suggestion.category}{' '}
                {category !== suggestion.category && (
                  <button
                    type="button"
                    onClick={() => setCategory(suggestion.category)}
                    className="ml-1 text-indigo-600 underline"
                  >
                    aplicar
                  </button>
                )}
              </p>
              <p className="text-indigo-900">
                <strong>Prioridad sugerida:</strong> {suggestion.priority}{' '}
                {priority !== suggestion.priority && (
                  <button
                    type="button"
                    onClick={() => setPriority(suggestion.priority)}
                    className="ml-1 text-indigo-600 underline"
                  >
                    aplicar
                  </button>
                )}
              </p>
              {suggestion.rewrittenTitle && (
                <p className="text-indigo-900">
                  <strong>Título más claro:</strong> «{suggestion.rewrittenTitle}»{' '}
                  <button
                    type="button"
                    onClick={() => setTitle(suggestion.rewrittenTitle!)}
                    className="ml-1 text-indigo-600 underline"
                  >
                    usar
                  </button>
                </p>
              )}
              {suggestion.rewrittenDescription && (
                <p className="text-indigo-900">
                  <strong>Descripción más clara:</strong> {suggestion.rewrittenDescription}{' '}
                  <button
                    type="button"
                    onClick={() => setDescription(suggestion.rewrittenDescription!)}
                    className="ml-1 text-indigo-600 underline"
                  >
                    usar
                  </button>
                </p>
              )}
              <p className="text-xs text-indigo-700/80">{suggestion.reason}</p>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Categoría" htmlFor="category">
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              required
              className={INPUT_CLASS}
            >
              <option value="">Selecciona…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Prioridad" htmlFor="priority">
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={INPUT_CLASS}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Nombre del solicitante" htmlFor="requester">
            <input
              id="requester"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              required
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField label="Persona asignada (opcional)" htmlFor="assigned">
            <input
              id="assigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Ej: Soporte N1"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        {saveError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Creando…' : 'Crear ticket'}
          </button>
          <Link href="/tickets" className="text-sm text-zinc-500 hover:underline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  )
}
