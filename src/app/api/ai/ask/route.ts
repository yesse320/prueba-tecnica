// Módulo 2.2 — El agente le hace preguntas libres al asistente
// directamente desde el panel del ticket.

import { NextResponse } from 'next/server'
import { askAssistant } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const { ticket, question } = await request.json()
    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Falta la pregunta' }, { status: 400 })
    }
    const result = await askAssistant(
      {
        title: ticket?.title ?? '',
        description: ticket?.description ?? '',
        category: ticket?.category ?? 'Otros',
        status: ticket?.status ?? 'Abierto',
      },
      question,
    )
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 },
    )
  }
}
