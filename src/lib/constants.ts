// Valores de dominio compartidos por toda la app.

export const CATEGORIES = [
  'Hardware',
  'Software',
  'Redes',
  'Cuentas y Acceso',
  'Correo',
  'Impresoras',
  'Otros',
] as const

export const PRIORITIES = ['Baja', 'Media', 'Alta'] as const

export const STATUSES = [
  'Abierto',
  'En Progreso',
  'Resuelto',
  'Cerrado',
] as const

export type Category = (typeof CATEGORIES)[number]
export type Priority = (typeof PRIORITIES)[number]
export type Status = (typeof STATUSES)[number]

// Flujo de estados permitido: Abierto -> En Progreso -> Resuelto -> Cerrado.
// Devuelve los estados a los que un ticket puede pasar desde el estado actual.
export function nextStatuses(current: Status): Status[] {
  switch (current) {
    case 'Abierto':
      return ['En Progreso']
    case 'En Progreso':
      return ['Resuelto']
    case 'Resuelto':
      return ['Cerrado']
    case 'Cerrado':
      return []
  }
}

// Clases de color de Tailwind para badges, según estado.
export const STATUS_STYLES: Record<Status, string> = {
  Abierto: 'bg-blue-100 text-blue-700 border-blue-200',
  'En Progreso': 'bg-amber-100 text-amber-700 border-amber-200',
  Resuelto: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Cerrado: 'bg-zinc-200 text-zinc-600 border-zinc-300',
}

export const PRIORITY_STYLES: Record<Priority, string> = {
  Baja: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  Media: 'bg-sky-100 text-sky-700 border-sky-200',
  Alta: 'bg-red-100 text-red-700 border-red-200',
}

// Para ordenar por urgencia en el listado del agente.
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  Alta: 0,
  Media: 1,
  Baja: 2,
}
