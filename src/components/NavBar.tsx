'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from './RoleProvider'

const LINKS = [
  { href: '/tickets', label: 'Tickets' },
  { href: '/chat', label: 'Chat en vivo' },
]

export function NavBar() {
  const { session, signOut, ready } = useSession()
  const pathname = usePathname()

  // No mostramos la barra en la pantalla de inicio (selección de rol).
  if (!ready || !session) return null

  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3 sm:gap-4">
        <Link href="/" className="mr-2 flex items-center gap-2 font-bold text-zinc-900">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-indigo-600 text-sm text-white">
            HD
          </span>
          <span className="hidden sm:inline">Help Desk EduLabs</span>
        </Link>

        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
              }`}
            >
              {link.label}
            </Link>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right text-sm leading-tight sm:block">
            <span className="block font-medium text-zinc-900">{session.name}</span>
            <span className="block text-xs capitalize text-zinc-500">{session.role}</span>
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              session.role === 'agente'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {session.role === 'agente' ? 'Agente' : 'Usuario'}
          </span>
          <button
            onClick={signOut}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Cambiar
          </button>
        </div>
      </nav>
    </header>
  )
}
