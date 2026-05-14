import type { ConversationStatus } from '@/lib/types'

const STATUS_INFO: Record<ConversationStatus, { label: string; className: string }> = {
  esperando: { label: 'Buscando agente', className: 'bg-amber-100 text-amber-700' },
  ia: { label: 'Atendida por IA', className: 'bg-violet-100 text-violet-700' },
  activa: { label: 'Con agente', className: 'bg-emerald-100 text-emerald-700' },
  cerrada: { label: 'Cerrada', className: 'bg-zinc-200 text-zinc-600' },
}

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const info = STATUS_INFO[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${info.className}`}
    >
      {info.label}
    </span>
  )
}
