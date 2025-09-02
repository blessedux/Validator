import { 
  TransactionBuilder, 
  Account, 
  Operation, 
  BASE_FEE,
  Networks
} from '@stellar/stellar-sdk'

// Network configuration
const getNetworkConfig = () => {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet'
  
  return {
    network,
    passphrase: network === 'testnet' 
      ? Networks.TESTNET 
      : Networks.PUBLIC
  }
}

// Check if Freighter extension is installed
export const isFreighterInstalled = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for the Freighter API library
  return !!(window as any).freighterApi
}

// Get Freighter API
const getFreighterApi = () => {
  if (typeof window === 'undefined') {
    throw new Error('Freighter API is only available in browser environment')
  }
  
  if (!(window as any).freighterApi) {
    throw new Error('Freighter API is not available. Please make sure the Freighter extension is installed and the API library is loaded.')
  }
  
  return (window as any).freighterApi
}

// Check if Freighter is available and connected
export const isFreighterAvailable = async (): Promise<boolean> => {
  try {
    const api = getFreighterApi()
    const result = await api.isConnected()
    return result.isConnected && !result.error
  } catch (error) {
    return false
  }
}

// Connect to Freighter wallet
export const connectFreighterWallet = async (): Promise<{ publicKey: string; network: string }> => {
  try {
    const api = getFreighterApi()
    
    // Debug: log available methods
    console.log('Available Freighter API methods:', Object.keys(api))
    
    // Always request fresh access instead of checking if connected
    console.log('🔍 Requesting fresh access to Freighter...')
    const accessResult = await api.requestAccess()
    console.log('🔍 Access result:', accessResult)
    
    if (accessResult.error) {
      throw new Error(`Freighter access request failed: ${accessResult.error}`)
    }
    
    // Check if access was granted by looking for the address
    if (!accessResult.address) {
      throw new Error('Freighter access was denied by user')
    }
    
    // Get network
    console.log('🔍 Getting network...')
    const networkResult = await api.getNetwork()
    console.log('🔍 Network result:', networkResult)
    
    if (networkResult.error) {
      throw new Error(`Failed to get network: ${networkResult.error}`)
    }
    
    const result = {
      publicKey: accessResult.address,
      network: networkResult.network
    }
    
    console.log('🔍 Returning result (fresh access):', result)
    return result
    
  } catch (error) {
    console.error('❌ Freighter connection error:', error)
    throw error
  }
}

// Create authentication challenge transaction
const createAuthChallengeTransaction = (walletAddress: string, challenge: string): string => {
  const networkConfig = getNetworkConfig()
  
  // Truncate challenge to fit within Stellar's 28-byte limit
  const truncatedChallenge = challenge.substring(0, 28)
  
  const transaction = new TransactionBuilder(
    new Account(walletAddress, '0'),
    {
      fee: BASE_FEE,
      networkPassphrase: networkConfig.passphrase
    }
  )
  .addOperation(
    Operation.manageData({
      name: 'auth_challenge',
      value: truncatedChallenge
    })
  )
  .setTimeout(30)
  .build()
  
  return transaction.toXDR()
}

// Sign transaction with Freighter
export const signTransactionWithFreighter = async (xdrTransaction: string): Promise<string> => {
  try {
    const api = getFreighterApi()
    
    // Ensure we're connected
    const connectedResult = await api.isConnected()
    if (connectedResult.error || !connectedResult.isConnected) {
      throw new Error('Freighter wallet is not connected')
    }
    
    // Get address for signing
    const addressResult = await api.getAddress()
    if (addressResult.error) {
      throw new Error(`Failed to get address for signing: ${addressResult.error}`)
    }
    
    // Sign the transaction
    const signedResult = await api.signTransaction(xdrTransaction, {
      network: getNetworkConfig().network,
      address: addressResult.address
    })
    
    if (signedResult.error) {
      throw new Error(`Transaction signing failed: ${signedResult.error}`)
    }
    
    return signedResult.signedTxXdr
  } catch (error) {
    console.error('Failed to sign transaction with Freighter:', error)
    throw new Error('Failed to sign transaction. Please try again.')
  }
}

// Complete authentication flow with Freighter
export const authenticateWithFreighter = async (challenge: string): Promise<{ publicKey: string; signature: string }> => {
  try {
    // Connect to wallet if not already connected
    const { publicKey } = await connectFreighterWallet()
    
    // Create challenge transaction
    const xdrTransaction = createAuthChallengeTransaction(publicKey, challenge)
    
    // Sign the transaction
    const signature = await signTransactionWithFreighter(xdrTransaction)
    
    return { publicKey, signature }
  } catch (error) {
    console.error('Freighter authentication failed:', error)
    throw error
  }
}

// Get wallet information
export const getFreighterWalletInfo = async (): Promise<{ publicKey: string; network: string; isConnected: boolean }> => {
  try {
    const api = getFreighterApi()
    const connectedResult = await api.isConnected()
    
    if (connectedResult.error || !connectedResult.isConnected) {
      return { publicKey: '', network: '', isConnected: false }
    }
    
    // Get address
    const addressResult = await api.getAddress()
    if (addressResult.error) {
      return { publicKey: '', network: '', isConnected: false }
    }
    
    // Get network
    const networkResult = await api.getNetwork()
    if (networkResult.error) {
      return { publicKey: '', network: '', isConnected: false }
    }
    
    return { 
      publicKey: addressResult.address, 
      network: networkResult.network, 
      isConnected: true 
    }
  } catch (error) {
    console.error('Failed to get Freighter wallet info:', error)
    return { publicKey: '', network: '', isConnected: false }
  }
}

// Disconnect from Freighter
export const disconnectFreighterWallet = async (): Promise<void> => {
  try {
    // Freighter doesn't have a disconnect method, so we just clear local state
    console.log('Freighter disconnect: clearing local state')
  } catch (error) {
    console.error('Failed to disconnect from Freighter:', error)
    // Don't throw error on disconnect failure
  }
}

// Get network display name
export const getNetworkDisplayName = (network: string): string => {
  switch (network.toLowerCase()) {
    case 'testnet':
      return 'Testnet'
    case 'public':
      return 'Mainnet'
    case 'futurenet':
      return 'Futurenet'
    default:
      return network
  }
} 