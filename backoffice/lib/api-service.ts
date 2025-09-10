// API Service for DOB Validator Backend
// Base URL: Use Next.js API routes for frontend endpoints, backend for backend-only endpoints
import { logWithDOBArt } from './utils'

// Import AuthToken type from auth module
export interface AuthToken {
  token: string
  expiresIn: string
  walletAddress: string
}

// Get the safe backend URL for production
function getSafeBackendUrl(): string {
  // In production, always use the production backend URL
  if (typeof window !== 'undefined' && window.location.hostname === 'backoffice.dobprotocol.com') {
    return 'https://v.dobprotocol.com'
  }

  // In development, use the environment variable or default
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://localhost:4000'
}

const API_BASE_URL = getSafeBackendUrl()

// Types for the backend API - Updated to match actual database schema
export interface Submission {
  id: string
  deviceName: string        // Updated to match schema
  deviceType: string        // Updated to match schema
  serialNumber: string      // Updated to match schema
  manufacturer: string
  model: string
  yearOfManufacture: string // Updated to match schema
  condition: string
  specifications: string
  purchasePrice: string     // Updated to match schema
  currentValue: string      // Updated to match schema
  expectedRevenue: string   // Updated to match schema
  operationalCosts: string  // Updated to match schema
  status: 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  submittedAt: string       // Updated to match schema
  updatedAt: string         // Updated to match schema
  userId: string            // Updated to match schema
  location: string
  user?: User
  adminReview?: AdminReview
  certificate?: Certificate
  files?: SubmissionFile[]
}

export interface User {
  id: string
  walletAddress: string
  email: string | null
  name: string | null
  role: 'OPERATOR' | 'ADMIN' | 'VALIDATOR'
  createdAt: string
  updatedAt: string
}

export interface AdminReview {
  id: string
  notes: string | null
  technicalScore: number | null      // Updated to match schema
  regulatoryScore: number | null     // Updated to match schema
  financialScore: number | null      // Updated to match schema
  environmentalScore: number | null  // Updated to match schema
  overallScore: number | null        // Updated to match schema
  decision: 'APPROVED' | 'REJECTED' | null
  decisionAt: string | null          // Updated to match schema
  reviewedAt: string                 // Updated to match schema
  submissionId: string               // Updated to match schema
}

export interface Certificate {
  id: string
  certificateHash: string
  stellarTxHash: string | null
  issuedAt: string
  expiresAt: string | null
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED'
  submissionId: string
  userId: string
}

export interface SubmissionFile {
  id: string
  filename: string
  path: string
  size: number
  mimeType: string
  documentType: string
  uploadedAt: string
  submissionId: string
}

export interface SubmissionsStats {
  total: number
  pending: number
  underReview: number
  approved: number
  rejected: number
  draft?: number
}

class ApiService {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }



  // Get authentication token from localStorage
  private getAuthToken(): string | null {
    if (this.authToken) return this.authToken

    if (typeof window === 'undefined') return null

    const authData = localStorage.getItem('authToken')
    if (!authData) return null

    try {
      const parsed = JSON.parse(authData)
      // Extract just the token string, not the whole object
      const token = parsed.token || parsed.access_token
      if (token) {
        return token
      }
      // If no token field found, return the raw data (for backward compatibility)
      return authData
    } catch {
      // If it's not JSON, assume it's a plain token
      return authData
    }
  }

  // Make authenticated request with proper headers for backoffice
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken()
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-backoffice-request': 'true', // Important: Mark as backoffice request for admin access
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    logWithDOBArt(`Making API request: ${options.method || 'GET'} ${url}`, 'info')

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      logWithDOBArt(`API request failed: ${response.status} ${errorText}`, 'error')
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    logWithDOBArt('API request successful', 'success')
    return data
  }

  // Get all submissions (admin only with backoffice access)
  async getAllSubmissions(options?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ submissions: Submission[]; total: number; hasMore?: boolean }> {
    const params = new URLSearchParams()

    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const queryString = params.toString()
    const endpoint = `/api/submissions${queryString ? `?${queryString}` : ''}`

    const response = await this.request<{
      success: boolean
      submissions: Submission[]
      total: number
      hasMore?: boolean
    }>(endpoint)

    return {
      submissions: response.submissions || [],
      total: response.total || 0,
      hasMore: response.hasMore
    }
  }

  // Get submissions stats
  async getSubmissionsStats(): Promise<SubmissionsStats> {
    try {
      // Fetch all submissions and calculate stats
      const [allSubmissions, pending, underReview, approved, rejected, drafts] = await Promise.all([
        this.getAllSubmissions({ limit: 1000 }), // Get all for stats
        this.getAllSubmissions({ status: 'PENDING', limit: 1000 }),
        this.getAllSubmissions({ status: 'UNDER_REVIEW', limit: 1000 }),
        this.getAllSubmissions({ status: 'APPROVED', limit: 1000 }),
        this.getAllSubmissions({ status: 'REJECTED', limit: 1000 }),
        this.getAllSubmissions({ status: 'DRAFT', limit: 1000 }),
      ])

      return {
        total: allSubmissions.total,
        pending: pending.total,
        underReview: underReview.total,
        approved: approved.total,
        rejected: rejected.total,
        draft: drafts.total,
      }
    } catch (error) {
      logWithDOBArt('Failed to fetch submission stats', 'error')
      console.error('Stats fetch error:', error)
      return {
        total: 0,
        pending: 0,
        underReview: 0,
        approved: 0,
        rejected: 0,
        draft: 0,
      }
    }
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: 'DRAFT' | 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  ): Promise<{ success: boolean; submission?: Submission; message?: string }> {
    try {
      const response = await this.request<{
        success: boolean
        submission: Submission
        message?: string
      }>(`/api/submissions/${submissionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })

      logWithDOBArt(`Submission ${submissionId} status updated to ${status}`, 'success')
      return {
        success: response.success,
        submission: response.submission,
        message: response.message
      }
    } catch (error) {
      logWithDOBArt(`Failed to update submission ${submissionId} status`, 'error')
      console.error('Update status error:', error)
      throw error
    }
  }

  // Get all drafts (admin access)
  async getAllDrafts(options?: {
    limit?: number
    offset?: number
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams()
      if (options?.limit) params.append('limit', options.limit.toString())
      if (options?.offset) params.append('offset', options.offset.toString())

      const queryString = params.toString()
      const endpoint = `/api/drafts${queryString ? `?${queryString}` : ''}`

      const response = await this.request<{
        success: boolean
        drafts: any[]
      }>(endpoint)

      return response.drafts || []
    } catch (error) {
      logWithDOBArt('Failed to fetch drafts', 'error')
      console.error('Drafts fetch error:', error)
      return []
    }
  }

  // Generate challenge for wallet authentication
  async generateChallenge(walletAddress: string): Promise<{ challenge: string }> {
    return this.request<{ challenge: string }>('/api/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    })
  }

  // Verify signature and get JWT token
  async verifySignature(
    walletAddress: string,
    signature: string,
    challenge: string
  ): Promise<{ token: string }> {
    return this.request<{ token: string }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        walletAddress,
        signature,
        challenge,
      }),
    })
  }

  // Get submission by ID
  async getSubmissionById(id: string): Promise<Submission> {
    const response = await this.request<{
      success: boolean
      submission: Submission
    }>(`/api/submissions/${id}`)

    return response.submission
  }

  // Admin review methods (placeholder for future implementation)
  async upsertAdminReview(reviewData: {
    submissionId: string
    notes?: string
    technicalScore?: number
    regulatoryScore?: number
    financialScore?: number
    environmentalScore?: number
    overallScore?: number
    decision?: 'APPROVED' | 'REJECTED'
  }): Promise<AdminReview> {
    return this.request<AdminReview>('/api/admin-reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
  }

  async generateCertificate(
    submissionId: string,
    stellarTxHash?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; certificate?: Certificate; message?: string }> {
    if (!submissionId) {
      throw new Error('submissionId is required')
    }

    const endpoint = `/certificate/generate/${submissionId}/${stellarTxHash || ''}`

    const body: any = { submissionId }
    if (stellarTxHash) body.stellarTxHash = stellarTxHash
    if (metadata) body.metadata = metadata 
    return this.request<{ success: boolean; certificate?: Certificate; message?: string }>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  // Add missing methods for backward compatibility
  isAuthenticated(): boolean {
    // Check if we have an auth token
    if (typeof window === 'undefined') return false
    const authData = localStorage.getItem('authToken')
    return !!authData
  }

  // Alias for getAllSubmissions for backward compatibility
  async getSubmissions(options?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ submissions: Submission[]; total: number }> {
    return this.getAllSubmissions(options)
  }

  setAuthToken(token: string | AuthToken): void {
    logWithDOBArt('Setting authentication token for API service', 'info')
    if (typeof token === 'string') {
      localStorage.setItem('authToken', token)
      this.authToken = token
    } else if (token && typeof token === 'object' && token.token) {
      localStorage.setItem('authToken', JSON.stringify(token))
      this.authToken = token.token
    }
  }
}

// Export singleton instance
export const apiService = new ApiService()

// Export the class for testing
export { ApiService } 