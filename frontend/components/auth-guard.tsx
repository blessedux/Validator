'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated()
      
      if (!authenticated) {
        router.push('/')
        return
      }
      
      setIsAuthorized(true)
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
} 