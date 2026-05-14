// Módulo 2.1 — Al crear un ticket: sugiere categoría, prioridad y
// una redacción más clara a partir del título y la descripción.

import { NextResponse } from 'next/server'
import { suggestTicketMeta } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const { title, description } = await request.json()
    if (typeof title !== 'string' && typeof description !== 'string') {
      return NextResponse.json({ error: 'Falta el texto del ticket' }, { status: 400 })
    }
    const suggestion = await suggestTicketMeta(title ?? '', description ?? '')
    return NextResponse.json(suggestion)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 },
    )
  }
}
