"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
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
import { Settings, Wallet, LogOut, Loader2, Crown, Shield } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { adminConfigService } from "@/lib/admin-config"
import { freighterService } from '@/lib/freighter-service'

// Helper function to truncate wallet address
function truncateAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}

export function StellarWallet() {
  const [isOpen, setIsOpen] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  // Load wallet state on mount
  useEffect(() => {
    const storedPublicKey = localStorage.getItem('stellarPublicKey')
    if (storedPublicKey) {
      setPublicKey(storedPublicKey)
      
      // Check admin status
      const adminWallet = adminConfigService.getAdminWallet(storedPublicKey)
      if (adminWallet) {
        setIsAdmin(true)
        setAdminRole(adminWallet.role)
        setPermissions(adminWallet.permissions)
      }
    }
  }, [])

  const startAuthenticationFlow = async (walletAddress: string) => {
    setWalletAuthenticating(true)
    
    try {
      console.log('🚀 Starting authentication flow...')
      console.log('🔍 Wallet address:', walletAddress)
      
      // Step 1: Request challenge
      console.log('📝 Step 1: Requesting challenge...')
      const challengeResponse = await apiService.generateChallenge(walletAddress)
      const { challenge } = challengeResponse
      console.log('✅ Received challenge:', challenge)

      // Step 2: Create and sign transaction
      console.log('🔐 Step 2: Creating challenge transaction...')
      const xdrTransaction = freighterService.createAuthChallengeTransaction(challenge, walletAddress)
      
      console.log('✍️ Step 3: Requesting signature from Freighter...')
      const signedXdr = await freighterService.signTransaction(xdrTransaction, {
        networkPassphrase: 'Test SDF Network ; September 2015', // Testnet passphrase
        accountToSign: walletAddress
      })
      
      console.log('✅ Transaction signed successfully')

      // Step 3: Verify signature and get JWT
      console.log('🔍 Step 4: Verifying signature...')
      await authAuthenticateWallet(walletAddress, signedXdr, challenge)
      
      console.log('🎉 Authentication successful!')
      toast({
        title: "Authentication successful",
        description: "Successfully authenticated with Freighter wallet",
      })

      // Update global state
      walletStateManager.authenticate()

      // Close the modal after successful authentication
      setIsOpen(false)
      
    } catch (error) {
      console.error('❌ Authentication failed:', error)
      toast({
        title: "Authentication failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
    } finally {
      setWalletAuthenticating(false)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    
    try {
      console.log('🔗 Connecting to Freighter wallet...')

      // Check if Freighter is available
      if (!await freighterService.isAvailable()) {
        throw new Error('Freighter wallet extension not found. Please install Freighter.')
      }

      // Request access
      const { address } = await freighterService.requestAccess()
      console.log('✅ Wallet connected:', address)

      // Store wallet info
      localStorage.setItem('stellarPublicKey', address)
      localStorage.setItem('stellarWallet', 'freighter')
      setPublicKey(address)

      // Update global state
      connectWallet(address, 'freighter')

      // Check if user is admin
      const adminWallet = adminConfigService.getAdminWallet(address)
      if (adminWallet) {
        setIsAdmin(true)
        setAdminRole(adminWallet.role)
        setPermissions(adminWallet.permissions)
        console.log('✅ Admin wallet verified:', adminWallet.role)

        // Start authentication flow
        await startAuthenticationFlow(address)
      } else {
        console.log('❌ Wallet not in admin list')
        toast({
          title: "Access denied",
          description: "This wallet is not authorized for admin access.",
          variant: "destructive"
        })
      }
      
    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive"
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    
    try {
      console.log('🔌 Disconnecting wallet...')
      
      // Clear local storage
      localStorage.removeItem('stellarPublicKey')
      localStorage.removeItem('stellarWallet')
      localStorage.removeItem('authToken')
      
      // Clear state
      setPublicKey(null)
      setIsAdmin(false)
      setAdminRole(null)
      setPermissions([])
      
      // Update global state
      disconnectWallet()
      
      // Close modal
      setIsOpen(false)
      
      console.log('✅ Wallet disconnected')
      toast({
        title: "Disconnected",
        description: "Wallet has been disconnected successfully.",
      })

      // Redirect to login page
      router.push('/')
      
    } catch (error) {
      console.error('❌ Disconnect failed:', error)
      toast({
        title: "Disconnect failed",
        description: "Failed to disconnect wallet properly.",
        variant: "destructive"
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleSettings = () => {
    setIsOpen(true)
  }

  return (
    <>
      {publicKey ? (
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              <Crown className="h-3 w-3" />
              {adminRole}
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSettings}
            className="flex items-center gap-2"
          >
            <Wallet className="h-4 w-4" />
            {truncateAddress(publicKey)}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-2"
        >
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </>
          )}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Wallet Settings
            </DialogTitle>
            <DialogDescription>
              Manage your Freighter wallet connection and view admin privileges.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {publicKey && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Connected Wallet</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{truncateAddress(publicKey)}</span>
                      <span className="text-xs text-gray-500">Freighter</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Admin Privileges</label>
                    <div className="mt-1 p-3 bg-green-50 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">{adminRole}</span>
                      </div>
                      <div className="text-xs text-green-700">
                        Permissions: {permissions.join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
                className="w-full flex items-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Disconnect Wallet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 