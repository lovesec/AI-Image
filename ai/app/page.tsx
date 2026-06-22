"use client"

import { useStore } from "@/lib/store"
import { LoginScreen } from "@/components/login-screen"
import { Workspace } from "@/components/workspace"

export default function Page() {
  const { user } = useStore()
  return user ? <Workspace /> : <LoginScreen />
}
