"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, X, HelpCircle, ExternalLink, Shield } from "lucide-react"

interface BrowserCompatibilityWarningProps {
  onDismiss?: () => void
  showOnConnect?: boolean
}

export function BrowserCompatibilityWarning({ onDismiss, showOnConnect = false }: BrowserCompatibilityWarningProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSeenWarning, setHasSeenWarning] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Check if user has already seen the warning
    const warningSeen = localStorage.getItem('freighter-wallet-warning-seen')
    if (warningSeen) {
      setHasSeenWarning(true)
    }
  }, [])

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('freighter-wallet-warning-seen', 'true')
    }
    setIsOpen(false)
    onDismiss?.()
  }

  const handleShowWarning = () => {
    setIsOpen(true)
  }

  // Don't show if user has already seen it and chose not to show again
  if (hasSeenWarning && !showOnConnect) {
    return null
  }

  return (
    <>
      {showOnConnect && (
        <div className="bg-gray-800 rounded-2xl p-6 text-white shadow-lg border border-gray-600 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600">
                <img 
                  src="/freighter_icon.svg" 
                  alt="Freighter" 
                  className="w-8 h-8"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">Download Freighter</p>
                <p className="text-gray-300 text-sm">to use this app</p>
              </div>
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-lg ml-8"
              onClick={() => window.open('https://www.freighter.app/', '_blank')}
            >
              Download
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Freighter Wallet Connection Guide
            </DialogTitle>
            <DialogDescription>
              Important information about connecting with Freighter wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">How to connect with Freighter:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Install Freighter:</strong> Download from <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">freighter.app</a></li>
                <li>• <strong>Create/Import Wallet:</strong> Set up your Stellar wallet in Freighter</li>
                <li>• <strong>Unlock Freighter:</strong> Make sure Freighter is unlocked and ready</li>
                <li>• <strong>Click Connect:</strong> Click "Connect Wallet" and approve the connection</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Troubleshooting connection issues:</h4>
              <div className="text-sm text-green-800 space-y-3">
                <div>
                  <strong>1. Freighter not detected:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Make sure Freighter extension is installed</li>
                    <li>• Refresh the page after installing Freighter</li>
                    <li>• Check if Freighter is enabled in your browser</li>
                  </ul>
                </div>
                
                <div>
                  <strong>2. Connection fails:</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• Make sure Freighter is unlocked</li>
                    <li>• Check if you're on the correct network (testnet/mainnet)</li>
                    <li>• Try disconnecting and reconnecting</li>
                    <li>• Clear browser cache and try again</li>
                  </ul>
                </div>

                <div>
                  <strong>3. Browser compatibility:</strong>
                  <p className="ml-4 mt-1">Freighter works best with Chrome, Firefox, Edge, and Brave. Safari has limited support.</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">About Freighter</h4>
              <p className="text-sm text-orange-800">
                Freighter is a secure, open-source Stellar wallet extension that provides direct integration with web applications. 
                It's the recommended wallet for DOB Validator and offers enhanced security and user experience.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dont-show-again" 
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <label htmlFor="dont-show-again" className="text-sm text-gray-600">
                Don't show this warning again
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDismiss}>
                Got it
              </Button>
              <Button 
                onClick={() => window.open('https://www.freighter.app/', '_blank')}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Freighter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 