import { PRIORITY_STYLES, STATUS_STYLES } from '@/lib/constants'
import type { Priority, Status } from '@/lib/constants'

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      <span aria-hidden>
        {priority === 'Alta' ? '▲' : priority === 'Media' ? '■' : '▼'}
      </span>
      {priority}
    </span>
  )
}
