'use client'

import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function UserAvatar() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <Avatar>
      <AvatarImage src={session.user.image || ""} />
      <AvatarFallback>
        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
      </AvatarFallback>
    </Avatar>
  )
}