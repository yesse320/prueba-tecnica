// Acceso a datos del Módulo 3 (Chat en vivo). Usa el cliente de Supabase.

import { supabase } from './supabase'
import type { Conversation, ConversationStatus, Message, SenderRole } from './types'

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function listConversationsByUser(userName: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_name', userName)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Conversation[]
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as Conversation) ?? null
}

export async function createConversation(
  userName: string,
  subject: string | null,
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_name: userName, subject, status: 'esperando' })
    .select()
    .single()
  if (error) throw error
  return data as Conversation
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Message[]
}

export async function sendMessage(
  conversationId: string,
  senderRole: SenderRole,
  senderName: string | null,
  content: string,
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_role: senderRole,
      sender_name: senderName,
      content,
    })
    .select()
    .single()
  if (error) throw error
  return data as Message
}

export async function setConversationStatus(
  id: string,
  status: ConversationStatus,
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (status === 'cerrada') patch.closed_at = new Date().toISOString()
  const { error } = await supabase.from('conversations').update(patch).eq('id', id)
  if (error) throw error
}

// Un agente se une (o toma) una conversación en curso.
export async function joinConversation(id: string, agentName: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'activa', agent_name: agentName })
    .eq('id', id)
  if (error) throw error
}
