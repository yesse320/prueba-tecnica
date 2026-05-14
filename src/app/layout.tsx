import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { RoleProvider } from '@/components/RoleProvider'
import { NavBar } from '@/components/NavBar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Help Desk EduLabs',
  description:
    'Sistema interno de soporte técnico: gestión de tickets, asistente de IA y chat en vivo.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <RoleProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
        </RoleProvider>
      </body>
    </html>
  )
}
