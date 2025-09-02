"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StellarWallet } from '@/components/stellar-wallet'
import { OptimizedSpline } from '@/components/ui/optimized-spline'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { apiService } from '@/lib/api-service'
import { walletStateManager } from '@/lib/wallet-state'

function clearAllLocalStorage() {
  if (typeof window !== 'undefined') {
    localStorage.clear()
    sessionStorage.clear()
    window.dispatchEvent(new Event('walletStateChange'))
  }
}

function isValidJWT(token: string): boolean {
  try {
    // Check if it's a real JWT
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }
    
    const payload = JSON.parse(atob(parts[1]))
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (!payload.exp) {
      return false
    }
    
    return payload.exp > currentTime
  } catch (error) {
    return false
  }
}

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isSplineHovered, setIsSplineHovered] = useState(false)
  const hasRedirected = useRef(false)
  const hasCheckedInitial = useRef(false)
  const isCheckingProfile = useRef(false)
  const lastCheckTime = useRef(0)
  const router = useRouter()

  // Mouse movement effect
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event
      const { innerWidth, innerHeight } = window
      
      // Normalize mouse position to -1 to 1 range
      const x = (clientX / innerWidth) * 2 - 1
      const y = (clientY / innerHeight) * 2 - 1
      
      setMousePosition({ x, y })
      
      // Also trigger star movement
      const customEvent = new CustomEvent('starsMouseMove', {
        detail: { x: clientX, y: clientY }
      });
      window.dispatchEvent(customEvent);
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const checkUserProfile = async () => {
      if (isCheckingProfile.current || hasRedirected.current) {
        return
      }
      const now = Date.now()
      if (now - lastCheckTime.current < 2000) {
        return
      }
      lastCheckTime.current = now
      if (!isAuthenticated()) {
        return
      }
      const authData = getAuthToken()
      if (!authData?.token) {
        return
      }
      if (!isValidJWT(authData.token)) {
        clearAllLocalStorage()
        return
      }
      isCheckingProfile.current = true
      setLoading(true)
      
      try {
        // First check local storage for development mode
        const isDevelopment = process.env.NODE_ENV === 'development' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname.includes('vercel.app');
        
        if (isDevelopment) {
          const walletAddress = localStorage.getItem('stellarPublicKey') || authData.walletAddress
          if (walletAddress) {
            const localProfileKey = `localProfile_${walletAddress}`
            const localProfile = localStorage.getItem(localProfileKey)
            const userProfile = localStorage.getItem('userProfile')
            
            if (localProfile || userProfile) {
              hasRedirected.current = true
              router.push('/dashboard')
              return
            }
          }
        }
        
        // Try API profile check
        const response = await apiService.getProfile()
        
        if (response.success && response.profile) {
        hasRedirected.current = true
        router.push('/dashboard')
        } else {
          hasRedirected.current = true
          router.push('/profile')
        }
      } catch (error: any) {
        console.error('❌ Profile check failed:', error)
        
        // Check for specific error types
        const errorMessage = error.message || error.toString()
        const is404 = errorMessage.includes('404') || 
                     errorMessage.includes('Profile not found') || 
                     errorMessage.includes('Endpoint not found') ||
                     errorMessage.includes('Not Found')
        
        const is401 = errorMessage.includes('401') || 
                     errorMessage.includes('Authentication') ||
                     errorMessage.includes('Unauthorized')
        
        if (is404) {
          hasRedirected.current = true
          router.push('/profile')
        } else if (is401) {
          clearAllLocalStorage()
        } else {
          // For unexpected errors (like 500), treat them as "no profile found" and redirect to profile creation
          hasRedirected.current = true
          router.push('/profile')
        }
      } finally {
        isCheckingProfile.current = false
        setLoading(false)
      }
    }

    // Listen for wallet state changes
    const handleWalletChange = () => {
      // Reset redirect flag when wallet state changes
      hasRedirected.current = false
      // Only check profile if user is authenticated
      if (isAuthenticated()) {
        checkUserProfile()
      } else {
        // Clear any existing redirect flags when not authenticated
        hasRedirected.current = false
      }
    }

    // Subscribe to wallet state changes
    const unsubscribe = walletStateManager.subscribe((state) => {
      if (state.isAuthenticated && isAuthenticated()) {
        // Reset redirect flag when wallet authenticates
        hasRedirected.current = false
        // Add a small delay to ensure authentication state is fully synchronized
        setTimeout(() => {
          checkUserProfile()
        }, 100)
      } else {
        hasRedirected.current = false
      }
    })

    // Only add event listeners if user is authenticated
    if (isAuthenticated()) {
      window.addEventListener('walletStateChange', handleWalletChange)
    }

    // Initial check only if authenticated and not already checked
    if (isAuthenticated() && !hasCheckedInitial.current) {
      hasCheckedInitial.current = true
      // Add a small delay for initial check to prevent race conditions
      setTimeout(() => {
        checkUserProfile()
      }, 100)
    }

    return () => {
      unsubscribe()
      window.removeEventListener('walletStateChange', handleWalletChange)
    }
  }, [router])

  return (
    <div className="relative w-full">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="text-foreground text-lg font-semibold animate-pulse">Checking authentication...</div>
        </div>
      )}
      
      {/* Main content container */}
      <div className="relative z-10 w-full h-screen">
        {/* Hero section - fixed content that stays in place */}
        <section className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full px-4 z-20">
          <div className="text-center max-w-2xl mx-auto">
            <div className="p-8">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                DOB Validator
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Connect your wallet to begin your device validation <br></br>and get investment-ready on our RWA platform.
              </p>
              <div className="mt-10 flex justify-center">
                <div className="w-full flex justify-center">
                  <div className="w-auto">
                    <div className="inline-block">
                      <div className="[&>button]:text-lg [&>button]:py-4 [&>button]:px-10 [&>button]:rounded-xl [&>button]:font-semibold [&>button]:shadow-lg [&>button]:text-foreground [&>button]:border-2 [&>button]:border-foreground [&>button]:hover:bg-foreground [&>button]:hover:text-background [&>button]:transition-all [&>button]:duration-300 pointer-events-auto">
                        <StellarWallet />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-16 text-lg text-muted-foreground">
                Submit your documentation and unlock new funding opportunities.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
