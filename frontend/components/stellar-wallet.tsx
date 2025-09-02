"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { 
  authenticateWallet as authAuthenticateWallet, 
  getAuthToken, 
  logout 
} from "@/lib/auth"
import { 
  walletStateManager, 
  connectWallet, 
  disconnectWallet, 
  setWalletConnecting, 
  setWalletAuthenticating 
} from '@/lib/wallet-state'
import { Settings, Wallet, LogOut, Loader2, AlertTriangle, HelpCircle, Download } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { BrowserCompatibilityWarning } from './browser-compatibility-warning'
import { 
  isFreighterInstalled,
  isFreighterAvailable,
  connectFreighterWallet,
  authenticateWithFreighter,
  getFreighterWalletInfo,
  disconnectFreighterWallet,
  getNetworkDisplayName
} from '@/lib/freighter-service'
import { Checkbox } from "@/components/ui/checkbox"

// Helper function to truncate wallet address
function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function StellarWallet() {
  const [isOpen, setIsOpen] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [network, setNetwork] = useState<string>('TESTNET')
  const [isConnecting, setWalletConnecting] = useState(false)
  const [isAuthenticating, setWalletAuthenticating] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showCompatibilityWarning, setShowCompatibilityWarning] = useState(false)
  const [rememberMe, setRememberMe] = useState(true) // Default to true for better UX

  const { toast } = useToast()
  const router = useRouter()

  // Subscribe to wallet state changes
  useEffect(() => {
    const unsubscribe = walletStateManager.subscribe((state) => {
      setPublicKey(state.publicKey)
      setWalletConnecting(state.isConnecting)
      setWalletAuthenticating(state.isAuthenticating)
    })

    return unsubscribe
  }, [])

  // Check localStorage for wallet state on mount and when it changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const storedPublicKey = localStorage.getItem('stellarPublicKey')
      if (!storedPublicKey) {
        // If no publicKey in localStorage, ensure component shows disconnected state
        setPublicKey(null)
        setNetwork('TESTNET')
      }
    }

    // Check on mount
    checkLocalStorage()

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'stellarPublicKey' || e.key === 'stellarWallet') {
        checkLocalStorage()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check when window gains focus (in case localStorage was cleared in another tab)
    const handleFocus = () => {
      checkLocalStorage()
    }
    
    window.addEventListener('focus', handleFocus)

    // Listen for wallet state change events
    const handleWalletStateChange = () => {
      checkLocalStorage()
    }
    
    window.addEventListener('walletStateChange', handleWalletStateChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('walletStateChange', handleWalletStateChange)
    }
  }, [])

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        if (isFreighterInstalled()) {
          const walletInfo = await getFreighterWalletInfo()
          if (walletInfo.isConnected) {
            setPublicKey(walletInfo.publicKey)
            setNetwork(walletInfo.network)
            connectWallet(walletInfo.publicKey, 'freighter')
          }
        }
      } catch (error) {
        console.error('Error checking existing connection:', error)
      }
    }

    checkExistingConnection()
  }, [])

  const startAuthenticationFlow = async (walletAddress: string, walletType: string, skipSignature = false) => {
    // Prevent multiple simultaneous authentication attempts
    if (isAuthenticating) {
      return
    }
    
    setWalletAuthenticating(true)
    
    try {
      // Check if we have a valid cached session first
      const cachedToken = localStorage.getItem('authToken')
      const cachedWallet = localStorage.getItem('stellarPublicKey')
      
      if (skipSignature && cachedToken && cachedWallet === walletAddress) {
        console.log('🔍 Using cached authentication session')
        
        // Verify the token is still valid by making a test request
        try {
          // Test the token by making a simple API call
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/api/profile`, {
            headers: {
              'Authorization': `Bearer ${cachedToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            console.log('✅ Cached session is valid, skipping signature')
            
            // Update global state
            walletStateManager.authenticate()
            
            toast({
              title: "Welcome back!",
              description: "Successfully reconnected with your wallet",
            })
            
            setIsOpen(false)
            return
          }
        } catch (error) {
          console.log('❌ Cached session invalid, proceeding with full authentication')
        }
      }

      // Step 1: Request challenge
      const challengeResponse = await apiService.generateChallenge(walletAddress)
      const { challenge } = challengeResponse

      // Add a small delay to ensure challenge is stored on server
      await new Promise(resolve => setTimeout(resolve, 500))

      // Step 2: Authenticate with Freighter
      const { publicKey, signature } = await authenticateWithFreighter(challenge)

      // Step 3: Verify signature and get JWT
      await authAuthenticateWallet(publicKey, signature, challenge)
      
      toast({
        title: "Authentication successful",
        description: `Successfully authenticated with Freighter wallet`,
      })

      // Update global state
      walletStateManager.authenticate()

      // Close the modal after successful authentication
      setIsOpen(false)
      
    } catch (error) {
      // Authentication failed - show error and clear wallet data
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Failed to authenticate wallet. Please try again.",
        variant: "destructive"
      })
      
      // Clear wallet data on authentication failure
      localStorage.removeItem('stellarPublicKey')
      localStorage.removeItem('stellarWallet')
      localStorage.removeItem('authToken')
      setPublicKey(null)
      disconnectWallet()
    } finally {
      setWalletAuthenticating(false)
    }
  }

  const handleConnect = async () => {
    setWalletConnecting(true)
    setConnectionError(null)
    
    try {
      // Debug logging
      console.log('🔍 Checking Freighter installation...')
      console.log('window.freighterApi exists:', !!(window as any).freighterApi)
      
      // Check if Freighter is installed
      if (!isFreighterInstalled()) {
        console.log('❌ Freighter not detected')
        setConnectionError('freighter-not-installed')
        setShowCompatibilityWarning(true)
        toast({
          title: "Freighter Not Installed",
          description: "Please install the Freighter extension to connect your wallet.",
          variant: "destructive"
        })
        return
      }

      console.log('✅ Freighter detected, checking availability...')

      // Check if Freighter is available
      const isAvailable = await isFreighterAvailable()
      console.log('Freighter available:', isAvailable)
      
      if (!isAvailable) {
        setConnectionError('freighter-not-available')
        setShowCompatibilityWarning(true)
        toast({
          title: "Freighter Not Available",
          description: "Please make sure Freighter is unlocked and try again.",
          variant: "destructive"
        })
        return
      }

      console.log('✅ Freighter available, connecting...')

      // Connect to Freighter
      const { publicKey, network } = await connectFreighterWallet()
      
      console.log('✅ Connected to Freighter - publicKey:', publicKey)
      console.log('✅ Connected to Freighter - network:', network)
      console.log('✅ Connected to Freighter - full object:', { publicKey, network })
      
      // Update local state
      setPublicKey(publicKey)
      setNetwork(network)
      localStorage.setItem('stellarPublicKey', publicKey)
      localStorage.setItem('stellarWallet', 'freighter')

      // Update global state
      connectWallet(publicKey, 'freighter')
      setWalletConnecting(false)

      // Start authentication flow with the value just received from Freighter
      console.log('🔍 Starting authentication flow with publicKey:', publicKey)
      if (!publicKey) {
        console.error('❌ publicKey is empty, cannot start authentication')
        throw new Error('Wallet public key is required for authentication')
      }
      
      // Check if we have a cached session for this wallet
      const cachedToken = localStorage.getItem('authToken')
      const cachedWallet = localStorage.getItem('stellarPublicKey')
      const hasCachedSession = cachedToken && cachedWallet === publicKey && rememberMe
      
      // Try to use cached session first, fallback to full authentication
      startAuthenticationFlow(publicKey, 'freighter', hasCachedSession)
      
    } catch (error) {
      console.error('❌ Connection failed:', error)
      setConnectionError('connection-failed')
      setShowCompatibilityWarning(true)
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Freighter wallet.",
        variant: "destructive"
      })
    } finally {
      setWalletConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    // Set disconnecting flag
    setIsDisconnecting(true)
    
    try {
      // Disconnect from Freighter
      await disconnectFreighterWallet()
    } catch (error) {
      console.error('Error disconnecting from Freighter:', error)
    }
    
    // Clear all wallet-related data and authentication
    logout()
    disconnectWallet()
    setIsOpen(false)
    
    // Clear all localStorage data to ensure clean state
    localStorage.removeItem('authToken')
    localStorage.removeItem('stellarPublicKey')
    localStorage.removeItem('stellarWallet')
    localStorage.removeItem('userProfile')
    
    // Clear any session storage as well
    sessionStorage.clear()
    
    // Call the global clear function to ensure everything is cleared
    if (typeof window !== 'undefined' && (window as any).clearAllLocalStorage) {
      (window as any).clearAllLocalStorage()
    }
    
    // Dispatch event for other components to react to wallet disconnection
    window.dispatchEvent(new Event('walletStateChange'))
    
    toast({
      title: "Disconnected",
      description: "Your wallet has been disconnected.",
    })

    // Force a page reload to clear any remaining state and prevent infinite loops
    window.location.href = '/'
  }

  // Get network info for display
  const networkDisplay = network ? getNetworkDisplayName(network) : 'Testnet'

  return (
    <>
      {/* Browser Compatibility Warning */}
      {showCompatibilityWarning && (
        <div className="mb-4">
          <BrowserCompatibilityWarning 
            showOnConnect={true}
            onDismiss={() => setShowCompatibilityWarning(false)}
          />
        </div>
      )}

      <Button
        onClick={publicKey ? () => setIsOpen(true) : handleConnect}
        variant="outline"
        disabled={isAuthenticating || isConnecting}
      >
        {isAuthenticating ? "Authenticating..." : 
         isConnecting ? "Connecting..." :
         publicKey ? (
           <div className="flex items-center gap-2">
             <span>{truncateAddress(publicKey)}</span>
             <span className="text-xs text-muted-foreground">({networkDisplay})</span>
           </div>
         ) : "Connect Wallet"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wallet Settings</DialogTitle>
            <DialogDescription>
              Manage your connected wallet and network settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {publicKey && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wallet Address:</span>
                  <span className="text-sm font-mono">{publicKey}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Network:</span>
                  <span className="text-sm">{networkDisplay}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Wallet Type:</span>
                  <span className="text-sm">Freighter</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Explorer:</span>
                  <a 
                    href={`https://stellar.expert/explorer/${network === 'public' ? 'public' : 'testnet'}/account/${publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View Account
                  </a>
                </div>
              </div>
            )}
            
            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember-me"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember my wallet connection
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              When enabled, you won't need to sign transactions for reconnection within 7 days.
            </p>
            
            <Button
              onClick={handleDisconnect}
              className="w-full"
              variant="destructive"
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect Wallet"}
            </Button>
            <Button
              onClick={() => setIsOpen(false)}
              className="w-full"
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 