// DOB Hub API Client for public certificate viewing
// This client connects to the same backend as frontend/backoffice but for public access

export interface Certificate {
  id: string
  deviceName: string
  deviceType: string
  location: string
  serialNumber: string
  manufacturer: string
  model: string
  yearOfManufacture: string
  condition: string
  specifications: string
  purchasePrice: number
  currentValue: number
  expectedRevenue: number
  operationalCosts: number
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  updatedAt: string
  user: {
    id: string
    walletAddress: string
    profileImage?: string
  }
  files?: Array<{
    id: string
    filename: string
    path: string
    size: number
    mimeType: string
    documentType: string
  }>
  reviews?: Array<{
    id: string
    notes: string
    technicalScore: number
    regulatoryScore: number
    financialScore: number
    environmentalScore: number
    overallScore: number
    decision: 'APPROVED' | 'REJECTED' | 'PENDING'
    createdAt: string
  }>
  blockchainData?: {
    transactionHash: string
    blockNumber: number
    network: string
    stellarExplorerUrl: string
  }
  certification?: {
    level: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE'
    riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
    trufaScore: number
    validationCriteria: string[]
    certifiedBy: string
    certificationDate: string
  }
}

export interface SearchParams {
  query?: string
  status?: string
  deviceType?: string
  manufacturer?: string
  limit?: number
  offset?: number
}

export interface SearchResponse {
  success: boolean
  certificates: Certificate[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface CertificateResponse {
  success: boolean
  certificate: Certificate
}

export interface VerificationResponse {
  success: boolean
  isValid: boolean
  certificate?: Certificate
  message: string
}

class DOBHubApiClient {
  private baseUrl: string

  constructor() {
    // Use the same backend as other applications
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Get all public certificates (approved only)
  async getPublicCertificates(params: SearchParams = {}): Promise<SearchResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.query) searchParams.append('query', params.query)
    if (params.deviceType) searchParams.append('deviceType', params.deviceType)
    if (params.manufacturer) searchParams.append('manufacturer', params.manufacturer)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    
    // Only show approved certificates for public viewing
    searchParams.append('status', 'APPROVED')
    
    const queryString = searchParams.toString()
    const endpoint = `/api/public/certificates${queryString ? `?${queryString}` : ''}`
    
    return this.request<SearchResponse>(endpoint)
  }

  // Get a specific certificate by ID (public access)
  async getCertificateById(id: string): Promise<CertificateResponse> {
    return this.request<CertificateResponse>(`/api/public/certificates/${id}`)
  }

  // Search certificates (public access)
  async searchCertificates(params: SearchParams): Promise<SearchResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.query) searchParams.append('query', params.query)
    if (params.deviceType) searchParams.append('deviceType', params.deviceType)
    if (params.manufacturer) searchParams.append('manufacturer', params.manufacturer)
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.offset) searchParams.append('offset', params.offset.toString())
    
    // Only search approved certificates
    searchParams.append('status', 'APPROVED')
    
    const queryString = searchParams.toString()
    const endpoint = `/api/public/certificates/search${queryString ? `?${queryString}` : ''}`
    
    return this.request<SearchResponse>(endpoint)
  }

  // Verify a certificate (public access)
  async verifyCertificate(id: string): Promise<VerificationResponse> {
    return this.request<VerificationResponse>(`/api/public/certificates/${id}/verify`)
  }

  // Get certificate statistics (public access)
  async getCertificateStats(): Promise<{
    success: boolean
    stats: {
      totalCertificates: number
      totalManufacturers: number
      totalDeviceTypes: number
      recentCertificates: number
    }
  }> {
    return this.request(`/api/public/certificates/stats`)
  }

  // Get featured certificates (public access)
  async getFeaturedCertificates(limit: number = 6): Promise<SearchResponse> {
    return this.request<SearchResponse>(`/api/public/certificates/featured?limit=${limit}`)
  }
}

// Export singleton instance
export const dobHubApi = new DOBHubApiClient()

// Export types for use in components
export type { Certificate, SearchParams, SearchResponse, CertificateResponse, VerificationResponse } 