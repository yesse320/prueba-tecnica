// Módulo 3 — Soporte de IA en el chat en vivo.
//
//  - mode: 'usuario'  -> la IA responde al usuario (no hay agente) e
//                        inserta el mensaje en la conversación.
//  - mode: 'agente'   -> la IA sugiere al agente la próxima respuesta
//                        (asiste en segundo plano); solo se devuelve.
//
// Los mensajes se leen del servidor desde Supabase para no depender de
// lo que envíe el cliente.

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { chatReplyForUser, chatSuggestionForAgent } from '@/lib/ai'
import type { Message } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { conversationId, mode } = await request.json()
    if (!conversationId) {
      return NextResponse.json({ error: 'Falta conversationId' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    const messages = (data ?? []) as Message[]

    if (mode === 'agente') {
      // La IA asiste al agente en segundo plano: solo sugerencia.
      const { suggestion, mode: aiMode } = await chatSuggestionForAgent(messages)
      return NextResponse.json({ suggestion, mode: aiMode })
    }

    // mode === 'usuario': la IA atiende y deja su respuesta en el chat.
    const { reply, mode: aiMode } = await chatReplyForUser(messages)
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_role: 'ia',
      sender_name: 'Asistente IA',
      content: reply,
    })
    if (insertError) throw insertError

    return NextResponse.json({ ok: true, mode: aiMode })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 },
    )
  }
}
