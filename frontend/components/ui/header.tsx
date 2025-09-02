"use client"

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { LogOut, User, ChevronDown, Home, Settings, FileText, Users, HelpCircle, MessageCircle, TrendingUp } from 'lucide-react'
import { isAuthenticated, getAuthToken } from '@/lib/auth'
import { apiService } from '@/lib/api-service'
import { disconnectWallet } from '@/lib/wallet-state'

function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

function getDisplayName(userProfile: any, publicKey: string | null): string {
  if (userProfile?.name) {
    return userProfile.name
  }
  if (publicKey) {
    return truncateAddress(publicKey)
  }
  return 'Profile'
}

function getDisplayEmail(userProfile: any, publicKey: string | null): string {
  if (userProfile?.email) {
    return userProfile.email
  }
  if (publicKey) {
    return publicKey
  }
  return ''
}

export function Header() {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuth, setIsAuth] = useState(false)
  const [showDobDropdown, setShowDobDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [isHoveringDob, setIsHoveringDob] = useState(false)
  const [isHoveringUser, setIsHoveringUser] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 0 })
  const [userProfile, setUserProfile] = useState<{ name?: string; company?: string; email?: string } | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  
  // Refs for hover detection
  const dobDropdownRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const dobTriggerRef = useRef<HTMLDivElement>(null)
  const userTriggerRef = useRef<HTMLDivElement>(null)

  // Check if we're on the homepage
  const isHomepage = pathname === '/'

  useEffect(() => {
    const checkAuth = async () => {
      // If we're on the homepage, show minimal navbar immediately
      if (isHomepage) {
        setIsLoading(false)
        setIsAuth(false)
        return
      }
      
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 3000)
        )
        
        const authPromise = isAuthenticated()
        const auth = await Promise.race([authPromise, timeoutPromise]) as boolean
        
        setIsAuth(auth)
        
        if (auth) {
          const token = getAuthToken()
          if (token) {
            try {
              const response = await apiService.getProfile()
              if (response.success) {
                setPublicKey(response.profile.publicKey)
                setHasProfile(true)
                setUserProfile(response.profile)
              }
            } catch (error) {
              console.error('Profile check failed:', error)
              // If user is authenticated but has no profile, they can still navigate
              // The dashboard will handle users without profiles
              setHasProfile(false)
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Set auth to false on error to show minimal navbar
        setIsAuth(false)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [isHomepage])

  // Handle window resize to reposition dropdowns
  useEffect(() => {
    const handleResize = () => {
      // Force re-render of dropdowns to update positioning
      if (showDobDropdown || showUserDropdown) {
        // This will trigger a re-render and recalculate positions
        setShowDobDropdown(showDobDropdown)
        setShowUserDropdown(showUserDropdown)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [showDobDropdown, showUserDropdown])

  // Reset dropdown states when authentication changes
  useEffect(() => {
    if (!isAuth) {
      setShowDobDropdown(false)
      setShowUserDropdown(false)
      setIsHoveringDob(false)
      setIsHoveringUser(false)
      setUserProfile(null)
    }
  }, [isAuth])

  // Fetch user profile when authenticated
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuth && publicKey) {
        try {
          const response = await apiService.getProfile()
          if (response.success && response.profile) {
            setUserProfile(response.profile)
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error)
          // Don't set error state, just keep existing profile or null
        }
      }
    }

    fetchUserProfile()
  }, [isAuth, publicKey])

  // Global mouse tracking for dropdown hover detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!showDobDropdown && !showUserDropdown) return

      // Check if mouse is over DOB trigger or dropdown area
      if (showDobDropdown) {
        const dobTrigger = dobTriggerRef.current
        const dobDropdown = dobDropdownRef.current
        
        if (dobTrigger && dobDropdown) {
          const triggerRect = dobTrigger.getBoundingClientRect()
          const dropdownRect = dobDropdown.getBoundingClientRect()
          
          // Add padding to prevent premature closing
          const padding = 20
          
          const isOverTrigger = e.clientX >= (triggerRect.left - padding) && 
                               e.clientX <= (triggerRect.right + padding) && 
                               e.clientY >= (triggerRect.top - padding) && 
                               e.clientY <= (triggerRect.bottom + padding)
          
          const isOverDropdown = e.clientX >= (dropdownRect.left - padding) && 
                                e.clientX <= (dropdownRect.right + padding) && 
                                e.clientY >= (dropdownRect.top - padding) && 
                                e.clientY <= (dropdownRect.bottom + padding)
          
          // Only close if mouse is clearly outside both areas
          if (!isOverTrigger && !isOverDropdown) {
            // Add a small delay to prevent flickering
            setTimeout(() => {
              setShowDobDropdown(false)
              setIsHoveringDob(false)
            }, 100)
          }
        }
      }

      // Check if mouse is over User trigger or dropdown area
      if (showUserDropdown) {
        const userTrigger = userTriggerRef.current
        const userDropdown = userDropdownRef.current
        
        if (userTrigger && userDropdown) {
          const triggerRect = userTrigger.getBoundingClientRect()
          const dropdownRect = userDropdown.getBoundingClientRect()
          
          // Add padding to prevent premature closing
          const padding = 20
          
          const isOverTrigger = e.clientX >= (triggerRect.left - padding) && 
                               e.clientX <= (triggerRect.right + padding) && 
                               e.clientY >= (triggerRect.top - padding) && 
                               e.clientY <= (triggerRect.bottom + padding)
          
          const isOverDropdown = e.clientX >= (dropdownRect.left - padding) && 
                                e.clientX <= (dropdownRect.right + padding) && 
                                e.clientY >= (dropdownRect.top - padding) && 
                                e.clientY <= (dropdownRect.bottom + padding)
          
          // Only close if mouse is clearly outside both areas
          if (!isOverTrigger && !isOverDropdown) {
            // Add a small delay to prevent flickering
            setTimeout(() => {
              setShowUserDropdown(false)
              setIsHoveringUser(false)
            }, 100)
          }
        }
      }
    }

    if (showDobDropdown || showUserDropdown) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [showDobDropdown, showUserDropdown])

  // Handle DOB dropdown hover
  const handleDobMouseEnter = () => {
    if (isAuth && !isHomepage) {
      setIsHoveringDob(true)
      setShowDobDropdown(true)
      // Calculate position
      if (dobTriggerRef.current) {
        const rect = dobTriggerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
          right: 0
        })
      }
    }
  }

  const handleDobMouseLeave = () => {
    // Don't close immediately, let the global mouse tracking handle it
  }

  // Handle DOB dropdown menu hover
  const handleDobDropdownMouseEnter = () => {
    setIsHoveringDob(true)
    setShowDobDropdown(true)
  }

  const handleDobDropdownMouseLeave = () => {
    // Don't close immediately, let the global mouse tracking handle it
  }

  // Handle User dropdown hover
  const handleUserMouseEnter = () => {
    setIsHoveringUser(true)
    setShowUserDropdown(true)
    // Calculate position
    if (userTriggerRef.current) {
      const rect = userTriggerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: 0,
        right: window.innerWidth - rect.right
      })
    }
  }

  const handleUserMouseLeave = () => {
    // Don't close immediately, let the global mouse tracking handle it
  }

  // Handle User dropdown menu hover
  const handleUserDropdownMouseEnter = () => {
    setIsHoveringUser(true)
    setShowUserDropdown(true)
  }

  const handleUserDropdownMouseLeave = () => {
    // Don't close immediately, let the global mouse tracking handle it
  }

  const handleLogout = async () => {
    try {
      // Clear all local storage
      localStorage.removeItem('stellarPublicKey')
      localStorage.removeItem('stellarWallet')
      localStorage.removeItem('authToken')
      localStorage.removeItem('userProfile')
      sessionStorage.clear()
      
      // Reset dropdown states immediately
      setShowDobDropdown(false)
      setShowUserDropdown(false)
      setIsHoveringDob(false)
      setIsHoveringUser(false)
      
      // Update state
      setIsAuth(false)
      setPublicKey(null)
      setHasProfile(false)
      setUserProfile(null)
      
      // Disconnect wallet state manager
      disconnectWallet()
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('walletStateChange'))
      
      // Navigate to home
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Render dropdowns using portal
  const renderDropdowns = () => {
    if (typeof window === 'undefined') return null

    return (
      <>
        {/* DOB Dropdown Portal */}
        {showDobDropdown && isAuth && !isHomepage && createPortal(
          <div
            ref={dobDropdownRef}
            className="fixed z-[999999] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl transition-all duration-300 ease-out"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: '16rem'
            }}
            onMouseEnter={handleDobDropdownMouseEnter}
            onMouseLeave={handleDobDropdownMouseLeave}
          >
            <div className="p-2">
              <div 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => router.push('/dashboard')}
              >
                <FileText size={18} className="text-gray-300" />
                <span className="text-white">My Projects</span>
              </div>
              <div 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => window.open('https://dobprotocol-1.gitbook.io/dobprotocol-wiki/dob-validator/overview', '_blank')}
              >
                <HelpCircle size={18} className="text-gray-300" />
                <span className="text-white">Wiki</span>
              </div>
              <div 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => window.open('https://t.me/andresanemic', '_blank')}
              >
                <MessageCircle size={18} className="text-gray-300" />
                <span className="text-white">Support</span>
              </div>
              <div 
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                onClick={() => window.open('https://home.dobprotocol.com', '_blank')}
              >
                <TrendingUp size={18} className="text-gray-300" />
                <span className="text-white">Liquidity Pools</span>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* User Dropdown Portal */}
        {showUserDropdown && isAuth && createPortal(
          <div
            ref={userDropdownRef}
            className="fixed z-[999999] bg-gray-800 border border-gray-600 rounded-lg shadow-2xl transition-all duration-300 ease-out"
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
              width: '14rem'
            }}
            onMouseEnter={handleUserDropdownMouseEnter}
            onMouseLeave={handleUserDropdownMouseLeave}
          >
            <div className="p-2">
              <div className="px-3 py-2 border-b border-gray-600">
                <p className="text-white text-sm font-medium">
                  {getDisplayName(userProfile, publicKey)}
                </p>
                <p className="text-gray-400 text-xs">
                  {getDisplayEmail(userProfile, publicKey)}
                </p>
              </div>
              <div className="p-2">
                <div 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                  onClick={() => router.push('/profile')}
                >
                  <User size={18} className="text-gray-300" />
                  <span className="text-white">Edit Profile</span>
                </div>
                <div 
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut size={18} className="text-gray-300" />
                  <span className="text-white">Disconnect Wallet</span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  if (isLoading) {
    return (
      <header className="relative z-[9999] bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
            <div className="h-8 w-24 bg-gray-700 animate-pulse rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <>
      <header className="relative z-[9999] bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* DOB Logo */}
            <div 
              ref={dobTriggerRef}
              className="relative"
              onMouseEnter={handleDobMouseEnter}
              onMouseLeave={handleDobMouseLeave}
            >
              <div className="flex items-center space-x-2 cursor-pointer group">
                <Image
                  src="/images/dob imagotipo.svg"
                  alt="DOB Protocol"
                  width={120}
                  height={40}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                {/* Only show chevron if not on homepage or if authenticated */}
                {(!isHomepage || isAuth) && (
                  <ChevronDown 
                    className={`text-gray-400 transition-transform duration-200 ${showDobDropdown ? 'rotate-180' : ''}`} 
                    size={16} 
                  />
                )}
              </div>
            </div>

            {/* User Actions - Only show if authenticated */}
            {isAuth ? (
              <div 
                ref={userTriggerRef}
                className="relative"
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <div className="flex items-center space-x-3 cursor-pointer group">
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200">
                    <User size={18} className="text-gray-300" />
                    <span className="text-white text-sm font-medium">
                      {getDisplayName(userProfile, publicKey)}
                    </span>
                    <ChevronDown 
                      className={`text-gray-400 transition-transform duration-200 ${showUserDropdown ? 'rotate-180' : ''}`} 
                      size={16} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Empty div to maintain layout when not authenticated
              <div></div>
            )}
          </div>
        </div>
      </header>
      {renderDropdowns()}
    </>
  )
}
