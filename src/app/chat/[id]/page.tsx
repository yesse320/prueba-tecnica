'use client'

import { use } from 'react'
import { Guard } from '@/components/Guard'
import { ChatRoom } from '@/components/chat/ChatRoom'

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return (
    <Guard>
      <ChatRoom id={id} />
    </Guard>
  )
}
