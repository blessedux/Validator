"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Global flags to prevent multiple script loads and initializations
let splineScriptLoaded = false
let globalInitializationInProgress = false

interface OptimizedSplineProps {
  url: string
  className?: string
  onLoad?: () => void
  onError?: (error: any) => void
  loadingDelay?: number
  fallbackContent?: React.ReactNode
  forceRefresh?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onMouseMove?: (e: React.MouseEvent) => void
}

export function OptimizedSpline({
  url,
  className,
  onLoad,
  onError,
  loadingDelay = 500,
  fallbackContent,
  forceRefresh = false,
  onMouseEnter,
  onMouseLeave,
  onMouseMove
}: OptimizedSplineProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const splineViewerRef = useRef<HTMLDivElement>(null)
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const scriptLoadedRef = useRef(false)
  const splineInstanceRef = useRef<any>(null)
  const isInitializedRef = useRef(false)

  // Load Spline viewer script
  const loadSplineScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if script is already loaded globally
      if (splineScriptLoaded && customElements.get('spline-viewer')) {
        scriptLoadedRef.current = true
        resolve()
        return
      }

      // Check for existing script tag
      const existingScript = document.querySelector('script[src*="spline-viewer"]')
      if (existingScript && !forceRefresh) {
        // Wait for the existing script to load
        const checkInterval = setInterval(() => {
          if (customElements.get('spline-viewer')) {
            clearInterval(checkInterval)
            splineScriptLoaded = true
            scriptLoadedRef.current = true
            resolve()
          }
        }, 100)
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Existing script failed to load'))
        }, 5000)
        return
      }

      // Remove existing script if force refresh is enabled
      if (forceRefresh && existingScript) {
        existingScript.remove()
        splineScriptLoaded = false
        scriptLoadedRef.current = false
      }

      // Create and load new script with cache busting
      const script = document.createElement('script')
      const timestamp = Date.now()
      script.src = `https://unpkg.com/@splinetool/viewer@latest/build/spline-viewer.js?v=${timestamp}`
      script.type = 'module'
      script.async = true
      
      const loadTimeout = setTimeout(() => {
        reject(new Error('Script load timeout'))
      }, 10000)

      script.onload = () => {
        clearTimeout(loadTimeout)
        splineScriptLoaded = true
        scriptLoadedRef.current = true
        resolve()
      }
      
      script.onerror = (error) => {
        clearTimeout(loadTimeout)
        reject(new Error('Failed to load Spline viewer script'))
      }

      document.head.appendChild(script)
    })
  }, [forceRefresh])

  // Create Spline viewer element
  const createSplineViewer = useCallback(() => {
    if (!splineViewerRef.current) {
      return false
    }

    if (isInitializedRef.current) {
      return false
    }

    if (!customElements.get('spline-viewer')) {
      return false
    }

    const container = splineViewerRef.current
    
    // Clear existing content
    container.innerHTML = ''
    
    try {
      const splineViewer = document.createElement('spline-viewer')
      // Add cache-busting parameter to the URL
      const cacheBustedUrl = forceRefresh ? `${url}?v=${Date.now()}` : url
      splineViewer.setAttribute('url', cacheBustedUrl)
      splineViewer.style.width = '100%'
      splineViewer.style.height = '100%'
      splineViewer.style.border = 'none'
      splineViewer.style.background = 'transparent'
      splineViewer.style.minWidth = '100px'
      splineViewer.style.minHeight = '100px'
      splineViewer.style.position = 'absolute'
      splineViewer.style.top = '0'
      splineViewer.style.left = '0'
      splineViewer.style.zIndex = '0'
      splineViewer.style.pointerEvents = 'auto'
      splineViewer.style.userSelect = 'none'
      splineViewer.style.touchAction = 'manipulation'

      // Prevent the scene from losing focus
      splineViewer.addEventListener('blur', (e) => {
        e.preventDefault()
        splineViewer.focus()
      })

      // Prevent default browser behaviors that might interfere
      splineViewer.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })

      splineViewer.addEventListener('selectstart', (e) => {
        e.preventDefault()
      })

      // Add hover event handlers
      if (onMouseEnter) {
        splineViewer.addEventListener('mouseenter', onMouseEnter)
      }
      if (onMouseLeave) {
        splineViewer.addEventListener('mouseleave', onMouseLeave)
      }
      if (onMouseMove) {
        splineViewer.addEventListener('mousemove', (e: Event) => {
          onMouseMove(e as unknown as React.MouseEvent)
        })
      }

      // Add error handling
      splineViewer.addEventListener('error', (error) => {
        console.error('Spline viewer error:', error)
        setHasError(true)
        setIsLoading(false)
        if (onError) {
          onError(error)
        }
      })

      // Add load handling
      splineViewer.addEventListener('load', () => {
        console.log('Spline viewer loaded successfully')
        splineInstanceRef.current = splineViewer
        setIsLoaded(true)
        setIsLoading(false)
        
        if (onLoad) {
          onLoad()
        }
      })

      // Add a timeout to detect if load event doesn't fire
      const loadTimeout = setTimeout(() => {
        if (!isLoaded && !hasError) {
          console.log('Spline load timeout, forcing load state')
          splineInstanceRef.current = splineViewer
          setIsLoaded(true)
          setIsLoading(false)
          
          onLoad?.()
        }
      }, 8000) // 8 second timeout

      container.appendChild(splineViewer)
      isInitializedRef.current = true
      
      // Clean up timeout if component unmounts
      return () => clearTimeout(loadTimeout)
    } catch (error) {
      console.error('Error creating Spline viewer:', error)
      setHasError(true)
      setIsLoading(false)
      onError?.(error)
      return false
    }
  }, [url, onLoad, onError, isLoaded, hasError, forceRefresh])

  // Initialize Spline
  useEffect(() => {
    let mounted = true

    // Prevent multiple initializations globally
    if (globalInitializationInProgress) {
      return
    }

    const initializeSpline = async () => {
      try {
        // Set global initialization flag
        globalInitializationInProgress = true
        
        // Check if already initialized
        if (isInitializedRef.current) {
          globalInitializationInProgress = false
          return
        }
        
        await loadSplineScript()
        
        if (!mounted) return

        // Wait for custom elements to be defined
        let attempts = 0
        const maxAttempts = 100 // 10 seconds max
        
        const waitForCustomElement = () => {
          if (customElements.get('spline-viewer')) {
            if (mounted) {
              createSplineViewer()
            }
          } else if (attempts < maxAttempts) {
            attempts++
            setTimeout(waitForCustomElement, 100)
          } else {
            setHasError(true)
            setIsLoading(false)
            onError?.(new Error('Spline custom element not available'))
          }
        }
        
        waitForCustomElement()
      } catch (error) {
        if (mounted) {
          setHasError(true)
          setIsLoading(false)
          if (onError) {
            onError(error)
          }
        }
      } finally {
        // Clear global initialization flag
        globalInitializationInProgress = false
      }
    }

    // Add loading delay for better UX
    loadingTimeoutRef.current = setTimeout(() => {
      if (mounted) {
        initializeSpline()
      }
    }, loadingDelay)

    return () => {
      mounted = false
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [loadSplineScript, createSplineViewer, loadingDelay, onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  // Prevent scroll events from affecting the Spline scene
  useEffect(() => {
    const handleScroll = (e: Event) => {
      if (splineInstanceRef.current) {
        // Prevent scroll events from bubbling to the Spline scene
        e.stopPropagation()
      }
    }

    const handleWheel = (e: WheelEvent) => {
      if (splineInstanceRef.current) {
        // Prevent wheel events from affecting the Spline scene
        e.stopPropagation()
      }
    }

    if (splineViewerRef.current) {
      splineViewerRef.current.addEventListener('scroll', handleScroll, { passive: false })
      splineViewerRef.current.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      if (splineViewerRef.current) {
        splineViewerRef.current.removeEventListener('scroll', handleScroll)
        splineViewerRef.current.removeEventListener('wheel', handleWheel)
      }
    }
  }, [isLoaded])

  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Spline Container - only show when loaded */}
      <div
        ref={splineViewerRef}
        className={cn(
          'absolute inset-0 transition-opacity duration-300 ease-in-out',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          minHeight: '400px'
        }}
      >
        {/* Fallback content */}
        {hasError && (
          <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
            {fallbackContent || (
              <div className="text-center text-muted-foreground">
                <div className="text-sm">3D Scene Unavailable</div>
                <div className="text-xs mt-1">The page will work normally</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 