'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Check if js-ready class is already present (added by inline scripts)
    const isAlreadyReady = document.documentElement.classList.contains('js-ready')
    
    if (isAlreadyReady) {
      // If js-ready is already present, start the loading sequence immediately
      const timer = setTimeout(() => {
        setIsLoading(false)
        setTimeout(() => {
          setIsVisible(false)
        }, 300)
      }, 500) // Shorter delay since content is already ready

      return () => {
        clearTimeout(timer)
      }
    } else {
      // Fallback: wait for js-ready class to be added
      const checkReady = () => {
        if (document.documentElement.classList.contains('js-ready')) {
          const timer = setTimeout(() => {
            setIsLoading(false)
            setTimeout(() => {
              setIsVisible(false)
            }, 300)
          }, 500)
          
          return () => {
            clearTimeout(timer)
          }
        } else {
          // Check again in 50ms
          setTimeout(checkReady, 50)
        }
      }
      
      checkReady()
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div
      data-loading-screen="true"
      className={`fixed inset-0 z-[9999] transition-all duration-700 ease-in-out ${
        isLoading 
          ? 'bg-background' 
          : 'bg-background/0 pointer-events-none'
      }`}
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Spinning wheel */}
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )
} 