// Módulo 2.2 — Al atender un ticket: analiza el sentimiento y sugiere
// una respuesta o solución inicial para el agente.

import { NextResponse } from 'next/server'
import { analyzeTicket } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, category, requester_name } = body
    if (!title || !description) {
      return NextResponse.json({ error: 'Faltan datos del ticket' }, { status: 400 })
    }
    const analysis = await analyzeTicket({
      title,
      description,
      category: category ?? 'Otros',
      requester_name: requester_name ?? 'el solicitante',
    })
    return NextResponse.json(analysis)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 },
    )
  }
}
