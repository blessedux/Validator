/**
 * Freighter Wallet Service for DOB Validator Backoffice
 * Handles all Freighter wallet interactions using the official Freighter API
 */

import { 
  TransactionBuilder, 
  Account, 
  Operation, 
  Networks 
} from 'stellar-sdk'

import {
  requestAccess as freighterRequestAccess,
  getAddress as freighterGetAddress,
  getNetworkDetails as freighterGetNetworkDetails,
  signTransaction as freighterSignTransaction,
  signMessage as freighterSignMessage,
  signAuthEntry as freighterSignAuthEntry,
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed
} from '@stellar/freighter-api'

export class FreighterService {
  /**
   * Check if Freighter is available in the browser
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    try {
      // Try to check if Freighter is allowed, which will tell us if it's available
      await freighterIsAllowed()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Check if user is connected to Freighter
   */
  async isConnected(): Promise<boolean> {
    try {
      const result = await freighterIsConnected()
      return result.isConnected
    } catch (error) {
      console.error('❌ Error checking Freighter connection:', error)
      return false
    }
  }

  /**
   * Request access to Freighter wallet
   */
  async requestAccess(): Promise<{ address: string }> {
    console.log('🔗 Requesting Freighter access...')
    
    try {
      if (!await this.isAvailable()) {
        throw new Error('Freighter wallet extension not found. Please install Freighter.')
      }

      const result = await freighterRequestAccess()
      return { address: result.address }
    } catch (error) {
      console.error('❌ Freighter access denied:', error)
      throw new Error('Freighter access was denied by user')
    }
  }

  /**
   * Get the current wallet address
   */
  async getAddress(): Promise<string> {
    try {
      const result = await freighterGetAddress()
      return result.address
    } catch (error) {
      console.error('❌ Error getting Freighter address:', error)
      throw new Error('Failed to get wallet address')
    }
  }

  /**
   * Get network details
   */
  async getNetworkDetails(): Promise<{ network: string; networkPassphrase: string }> {
    try {
      return await freighterGetNetworkDetails()
    } catch (error) {
      console.error('❌ Error getting network details:', error)
      throw new Error('Failed to get network details')
    }
  }

  /**
   * Sign a transaction with Freighter
   */
  async signTransaction(
    xdr: string, 
    opts?: { networkPassphrase?: string; accountToSign?: string }
  ): Promise<string> {
    try {
      console.log('✍️ Signing transaction with Freighter...')
      const result = await freighterSignTransaction(xdr, {
        networkPassphrase: opts?.networkPassphrase,
        address: opts?.accountToSign
      })
      return result.signedTxXdr
    } catch (error) {
      console.error('❌ Error signing transaction:', error)
      throw new Error('Failed to sign transaction')
    }
  }

  /**
   * Sign a message with Freighter
   */
  async signMessage(
    message: string,
    opts?: { accountToSign?: string }
  ): Promise<string> {
    try {
      const result = await freighterSignMessage(message, {
        networkPassphrase: Networks.TESTNET,
        address: opts?.accountToSign
      })
      // Handle both v3 and v4 response formats
      if (typeof result === 'string') {
        return result
      }
      if (result.signedMessage) {
        return typeof result.signedMessage === 'string' 
          ? result.signedMessage 
          : result.signedMessage.toString()
      }
      throw new Error('No signed message returned')
    } catch (error) {
      console.error('❌ Error signing message:', error)
      throw new Error('Failed to sign message')
    }
  }

  /**
   * Sign an auth entry with Freighter
   */
  async signAuthEntry(
    entry: string,
    opts?: { accountToSign?: string }
  ): Promise<string> {
    try {
      const result = await freighterSignAuthEntry(entry, {
        networkPassphrase: Networks.TESTNET,
        address: opts?.accountToSign
      })
      // Convert Buffer to string if necessary
      if (result.signedAuthEntry) {
        return result.signedAuthEntry.toString('base64')
      }
      throw new Error('No signed auth entry returned')
    } catch (error) {
      console.error('❌ Error signing auth entry:', error)
      throw new Error('Failed to sign auth entry')
    }
  }

  /**
   * Create a challenge transaction for authentication
   */
  createAuthChallengeTransaction(challenge: string, walletAddress: string): string {
    try {
      console.log('🔐 Creating challenge transaction for:', walletAddress)
      
      // Create a simple transaction with the challenge as memo
      const source = new Account(walletAddress, '0')
      
      const transaction = new TransactionBuilder(source, {
        fee: '100',
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(Operation.manageData({
          name: 'auth_challenge',
          value: challenge
        }))
        .setTimeout(300)
        .build()

      return transaction.toXDR()
    } catch (error) {
      console.error('❌ Error creating challenge transaction:', error)
      throw new Error('Failed to create challenge transaction')
    }
  }
}

// Export singleton instance
export const freighterService = new FreighterService()

// Export individual functions for compatibility
export const {
  isAvailable,
  isConnected,
  requestAccess,
  getAddress,
  getNetworkDetails,
  signTransaction,
  signMessage,
  signAuthEntry
} = freighterService 