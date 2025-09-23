// app/woo-aichat/chat/page.tsx
import { redirect } from 'next/navigation'

export default async function NewChatPage() {
  // TODO: create in DB; using crypto UUID as placeholder
  const id = crypto.randomUUID()
  redirect(`/woo-aichat/chat/${id}`)
}
