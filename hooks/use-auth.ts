// hooks/use-auth.ts
'use client'

import { useUser } from '@auth0/nextjs-auth0'

export function useAuth() {
  const { user, error, isLoading } = useUser()

  return {
    isAuthenticated: !!user,
    isLoading,
    user,
    error,
    login: () => {
      window.location.href = '/auth/login'
    },
    logout: () => {
      window.location.href = '/auth/logout'
    },
  }
}