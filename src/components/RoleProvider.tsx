'use client'

// Manejo de "sesión" del prototipo. No es autenticación real: la persona
// elige al entrar si es Usuario o Agente y escribe su nombre. Se guarda en
// localStorage para que persista entre recargas.

import { createContext, useContext, useEffect, useState } from 'react'
import type { AppRole, SessionUser } from '@/lib/types'

const STORAGE_KEY = 'helpdesk_session'

interface RoleContextValue {
  session: SessionUser | null
  ready: boolean // true cuando ya se leyó localStorage (evita parpadeo)
  signIn: (role: AppRole, name: string) => void
  signOut: () => void
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined)

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Se lee localStorage de forma síncrona y se aplica el estado en un
    // microtask para no llamar a setState dentro del cuerpo del efecto.
    let initial: SessionUser | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) initial = JSON.parse(raw) as SessionUser
    } catch {
      // localStorage no disponible o JSON inválido: se ignora.
    }
    queueMicrotask(() => {
      if (initial) setSession(initial)
      setReady(true)
    })
  }, [])

  function signIn(role: AppRole, name: string) {
    const next: SessionUser = { role, name: name.trim() || 'Invitado' }
    setSession(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function signOut() {
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <RoleContext.Provider value={{ session, ready, signIn, signOut }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useSession(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <RoleProvider>')
  return ctx
}
