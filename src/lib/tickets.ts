// Acceso a datos del Módulo 1 (Tickets). Usa el cliente de Supabase.

import { supabase } from './supabase'
import type { Ticket, TicketStatusHistory } from './types'
import type { Category, Priority, Status } from './constants'

export interface NewTicketInput {
  title: string
  description: string
  category: Category
  priority: Priority
  requester_name: string
  assigned_to: string | null
}

export interface TicketFilters {
  status?: Status | 'todos'
  category?: Category | 'todas'
}

export async function listTickets(filters: TicketFilters = {}): Promise<Ticket[]> {
  let query = supabase.from('tickets').select('*')

  if (filters.status && filters.status !== 'todos') {
    query = query.eq('status', filters.status)
  }
  if (filters.category && filters.category !== 'todas') {
    query = query.eq('category', filters.category)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Ticket[]
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const { data, error } = await supabase.from('tickets').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return (data as Ticket) ?? null
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  // El historial inicial (old_status = null) lo registra un trigger en la BD.
  const { data, error } = await supabase.from('tickets').insert(input).select().single()
  if (error) throw error
  return data as Ticket
}

export async function updateTicketStatus(id: string, newStatus: Status): Promise<void> {
  // El trigger de la BD registra automáticamente el cambio en el historial.
  const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', id)
  if (error) throw error
}

export async function deleteTicket(id: string): Promise<void> {
  // Un trigger en la BD impide eliminar tickets que no estén "Cerrado".
  const { error } = await supabase.from('tickets').delete().eq('id', id)
  if (error) throw error
}

export async function getStatusHistory(ticketId: string): Promise<TicketStatusHistory[]> {
  const { data, error } = await supabase
    .from('ticket_status_history')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('changed_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as TicketStatusHistory[]
}
