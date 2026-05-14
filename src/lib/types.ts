// Tipos que reflejan las filas de la base de datos (ver supabase/schema.sql).

import type { Category, Priority, Status } from './constants'

export interface Ticket {
  id: string
  title: string
  description: string
  category: Category
  priority: Priority
  status: Status
  requester_name: string
  assigned_to: string | null
  created_at: string
  updated_at: string
}

export interface TicketStatusHistory {
  id: string
  ticket_id: string
  old_status: Status | null
  new_status: Status
  changed_at: string
}

export type ConversationStatus = 'esperando' | 'ia' | 'activa' | 'cerrada'

export interface Conversation {
  id: string
  user_name: string
  subject: string | null
  status: ConversationStatus
  agent_name: string | null
  created_at: string
  closed_at: string | null
}

export type SenderRole = 'usuario' | 'agente' | 'ia' | 'sistema'

export interface Message {
  id: string
  conversation_id: string
  sender_role: SenderRole
  sender_name: string | null
  content: string
  created_at: string
}

// Rol con el que la persona entra al sistema (no es autenticación real).
export type AppRole = 'usuario' | 'agente'

export interface SessionUser {
  role: AppRole
  name: string
}
