import { Certificate } from '@/lib/api/api-client'

// Format currency values
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Format dates
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Format relative time
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return formatDate(dateString)
}

// Generate certificate QR code data
export const generateCertificateQRData = (certificateId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hub.dobprotocol.com'
  return `${baseUrl}/certificates/${certificateId}`
}

// Generate certificate sharing URL
export const generateCertificateShareUrl = (certificateId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hub.dobprotocol.com'
  return `${baseUrl}/certificates/${certificateId}`
}

// Validate certificate ID format
export const isValidCertificateId = (id: string): boolean => {
  // Certificate IDs should be UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Get certificate status color
export const getStatusColor = (status: Certificate['status']): string => {
  switch (status) {
    case 'APPROVED':
      return 'text-green-600 bg-green-100'
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100'
    case 'REJECTED':
      return 'text-red-600 bg-red-100'
    case 'DRAFT':
      return 'text-gray-600 bg-gray-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

// Get certificate status label
export const getStatusLabel = (status: Certificate['status']): string => {
  switch (status) {
    case 'APPROVED':
      return 'Approved'
    case 'PENDING':
      return 'Pending Review'
    case 'REJECTED':
      return 'Rejected'
    case 'DRAFT':
      return 'Draft'
    default:
      return 'Unknown'
  }
}

// Calculate certificate score
export const calculateCertificateScore = (certificate: Certificate): number => {
  if (!certificate.reviews || certificate.reviews.length === 0) {
    return 0
  }

  const latestReview = certificate.reviews[certificate.reviews.length - 1]
  return latestReview.overallScore
}

// Get certificate score color
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600'
  if (score >= 80) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 60) return 'text-orange-600'
  return 'text-red-600'
}

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Get device type icon
export const getDeviceTypeIcon = (deviceType: string): string => {
  const type = deviceType.toLowerCase()
  
  if (type.includes('solar') || type.includes('panel')) return '☀️'
  if (type.includes('wind') || type.includes('turbine')) return '💨'
  if (type.includes('battery') || type.includes('storage')) return '🔋'
  if (type.includes('grid') || type.includes('transformer')) return '⚡'
  if (type.includes('meter') || type.includes('monitor')) return '📊'
  if (type.includes('charger') || type.includes('ev')) return '🔌'
  
  return '🏭'
}

// Generate certificate metadata for SEO
export const generateCertificateMetadata = (certificate: Certificate) => {
  return {
    title: `${certificate.deviceName} - DOB Protocol Certificate`,
    description: `Verified certificate for ${certificate.deviceName} by ${certificate.manufacturer}. View details, specifications, and verification status.`,
    keywords: [
      'DOB Protocol',
      'certificate',
      'verification',
      certificate.deviceName,
      certificate.manufacturer,
      certificate.deviceType,
      'blockchain',
      'infrastructure'
    ].join(', '),
    openGraph: {
      title: `${certificate.deviceName} - DOB Protocol Certificate`,
      description: `Verified certificate for ${certificate.deviceName} by ${certificate.manufacturer}`,
      type: 'website',
      url: generateCertificateShareUrl(certificate.id),
      images: [
        {
          url: '/api/certificates/og-image',
          width: 1200,
          height: 630,
          alt: `${certificate.deviceName} Certificate`
        }
      ]
    }
  }
}

// Debounce function for search
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Generate certificate ID from wallet address and timestamp
export const generateCertificateId = (walletAddress: string, timestamp: number): string => {
  const hash = walletAddress.slice(2, 10) + timestamp.toString(16)
  return `DOB-${hash.toUpperCase()}`
}

// Validate search query
export const validateSearchQuery = (query: string): boolean => {
  return query.length >= 2 && query.length <= 100
}

// Get certificate verification message
export const getVerificationMessage = (isValid: boolean, certificate?: Certificate): string => {
  if (!isValid) {
    return 'This certificate could not be verified. It may be invalid or no longer active.'
  }
  
  if (!certificate) {
    return 'Certificate verification failed.'
  }
  
  return `This certificate is verified and active. It was validated on ${formatDate(certificate.createdAt)}.`
} 