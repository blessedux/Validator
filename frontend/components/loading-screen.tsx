'use client'

import { useEffect, useState } from 'react'

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Start the loading sequence after a fixed delay
    const timer = setTimeout(() => {
      setIsLoading(false)
      // Keep preloader visible until content is fully faded in, then remove from DOM
      setTimeout(() => {
        setIsVisible(false)
      }, 1600) // Wait for content fade-in to complete (800ms) + extra buffer
    }, 800) // Fixed delay for consistent timing

    return () => {
      clearTimeout(timer)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div
      data-loading-screen="true"
      className="fixed inset-0 z-[9999] bg-background"
      style={{ backgroundColor: '#1a1a1a' }}
    >
      {/* Spinning wheel */}
      <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-in-out ${
        isLoading ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="w-8 h-8 border-2 border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    </div>
  )
} 