import { getSafeBackendUrl } from './api-utils'

// Use the backend URL for all API calls to ensure consistency
const API_BASE_URL = getSafeBackendUrl()

// Check if we're in development/testing mode
const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1'
}

class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getAuthToken(): string | null {
    try {
      const authData = localStorage.getItem('authToken')
      console.log('🔍 Auth data from localStorage:', authData)
      
      if (authData) {
        const parsedAuth = JSON.parse(authData)
        console.log('🔍 Parsed auth data:', parsedAuth)
        
        // Handle both real auth token format and mock token format
        if (parsedAuth.token) {
          // Real auth token format: { token: string, expiresIn: string, walletAddress: string, expiresAt: number }
          console.log('🔍 Using real auth token format')
          return parsedAuth.token
        } else if (parsedAuth.access_token) {
          // Mock session format: { access_token: string, refresh_token: string, ... }
          console.log('🔍 Using mock session format')
          return parsedAuth.access_token
        } else if (typeof parsedAuth === 'string') {
          // Direct token string
          console.log('🔍 Using direct token string format')
          return parsedAuth
        }
      }
    } catch (error) {
      console.error('Failed to parse auth token:', error)
    }
    return null
  }

  private getWalletAddress(): string | null {
    try {
      const authData = localStorage.getItem('authToken')
      if (authData) {
        const parsedAuth = JSON.parse(authData)
        return parsedAuth.walletAddress || localStorage.getItem('stellarPublicKey')
      }
      return localStorage.getItem('stellarPublicKey')
    } catch (error) {
      console.error('Failed to get wallet address:', error)
      return localStorage.getItem('stellarPublicKey')
    }
  }

  // Local storage profile management for development/testing
  private getLocalProfile(): any | null {
    if (!isDevelopmentMode()) return null
    
    try {
      const walletAddress = this.getWalletAddress()
      if (!walletAddress) return null
      
      const profileKey = `localProfile_${walletAddress}`
      const profileData = localStorage.getItem(profileKey)
      return profileData ? JSON.parse(profileData) : null
    } catch (error) {
      console.error('Failed to get local profile:', error)
      return null
    }
  }

  private setLocalProfile(profileData: any): void {
    if (!isDevelopmentMode()) return
    
    try {
      const walletAddress = this.getWalletAddress()
      if (!walletAddress) return
      
      const profileKey = `localProfile_${walletAddress}`
      const profileToStore = {
        ...profileData,
        walletAddress,
        createdAt: profileData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: profileData.id || `local_${Date.now()}`
      }
      
      localStorage.setItem(profileKey, JSON.stringify(profileToStore))
      console.log('✅ [LocalStorage] Profile stored:', profileToStore)
    } catch (error) {
      console.error('Failed to set local profile:', error)
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Use the backend URL for all API calls
    const url = `${this.baseUrl}${endpoint}`
    
    console.log(`🔍 URL resolution debug:`)
    console.log(`  - endpoint: ${endpoint}`)
    console.log(`  - baseUrl: ${this.baseUrl}`)
    console.log(`  - final url: ${url}`)
    
    // Check if this is a FormData request
    const isFormData = options.body instanceof FormData
    
    // Add cache-busting headers for browser compatibility
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }

    // Add any additional headers from options
    if (options.headers) {
      Object.assign(headers, options.headers)
    }

    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }

    // Add authorization header if token exists
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      console.log(`🔍 Making API request to: ${url}`)
      console.log(`🔍 Headers:`, headers)
      if (isFormData) {
        console.log(`🔍 FormData entries:`, Array.from((options.body as FormData).entries()).map(([key, value]) => `${key}: ${value instanceof File ? value.name : value}`))
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
      })
      
      console.log(`🔍 Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`❌ API request failed: ${response.status}`, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ API request successful:`, data)
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication - Use backend URL for all auth endpoints
  async generateChallenge(walletAddress: string) {
    console.log('🔍 Generating challenge for wallet:', walletAddress)
    return this.request<{ challenge: string }>('/api/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    })
  }

  async verifySignature(walletAddress: string, signature: string, challenge: string) {
    console.log('🔍 Verifying signature for wallet:', walletAddress)
    return this.request<{ success: boolean; token: string; expiresIn: string; walletAddress: string; expiresAt: number }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, challenge }),
    })
  }

  // Wallet login
  async walletLogin(walletAddress: string, signature: string, challenge: string) {
    return this.request<{ 
      success: boolean; 
      access_token: string; 
      refresh_token: string; 
      user: any;
      session: any;
    }>('/api/auth/wallet-login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, challenge }),
    })
  }

  // Profile - Always query database using wallet address
  async getProfile() {
    console.log('🔍 Querying database for profile with wallet address:', this.getWalletAddress())
    
    // For development mode, try local storage first
    if (isDevelopmentMode()) {
      const localProfile = this.getLocalProfile()
      if (localProfile) {
        console.log('✅ Found local profile:', localProfile)
        return { success: true, profile: localProfile }
      }
    }
    
    return this.request<{ success: boolean; profile: any }>('/api/profile')
  }

  async createProfile(profileData: { name: string; company?: string; email: string; profileImage?: string }) {
    console.log('🔍 Creating profile with data:', profileData)
    
    // For development mode, store in localStorage
    if (isDevelopmentMode()) {
      const profileToStore = {
        ...profileData,
        id: `local_${Date.now()}`,
        publicKey: this.getWalletAddress(),
        walletAddress: this.getWalletAddress(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      this.setLocalProfile(profileToStore)
      console.log('✅ [LocalStorage] Profile created:', profileToStore)
      return { success: true, profile: profileToStore }
    }
    
    return this.request<{ success: boolean; profile: any }>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    })
  }

  async uploadProfileImage(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    return this.request<{ success: boolean; imageUrl: string }>('/api/profile/upload-image', {
      method: 'POST',
      body: formData,
    })
  }

  // Submissions
  async getSubmissions(options?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    
    const queryString = params.toString()
    const endpoint = queryString ? `/api/submissions?${queryString}` : '/api/submissions'
    
    return this.request<{ success: boolean; submissions: any[]; total: number }>(endpoint)
  }

  // Drafts
  async getDrafts(options?: {
    limit?: number
    offset?: number
  }) {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    
    const queryString = params.toString()
    const endpoint = queryString ? `/api/drafts?${queryString}` : '/api/drafts'
    
    return this.request<{ success: boolean; drafts: any[]; total: number }>(endpoint)
  }

  // File uploads
  async uploadFiles(formData: FormData) {
    return this.request<{ success: boolean; files: any[] }>('/api/upload-files', {
      method: 'POST',
      body: formData,
    })
  }

  // Device submission
  async submitDevice(formData: FormData) {
    return this.request<{ success: boolean; submission: any }>('/api/submissions', {
      method: 'POST',
      body: formData,
    })
  }

  // Delete draft
  async deleteDraft(draftId: string) {
    return this.request<{ success: boolean }>(`/api/drafts/${draftId}`, {
      method: 'DELETE',
    })
  }
}

// Export a singleton instance
export const apiService = new ApiService()