"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Eye, 
  Download, 
  Share2, 
  Copy, 
  ExternalLink,
  Calendar,
  MapPin,
  Building,
  FileText,
  Star,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { dobHubApi, type Certificate } from '@/lib/api/api-client'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  getStatusLabel, 
  getDeviceTypeIcon,
  generateCertificateShareUrl,
  formatFileSize,
  calculateCertificateScore,
  getScoreColor
} from '@/lib/utils/dobhub-utils'
import { mockCertificates } from '@/lib/utils/mock-data'

export default function CertificateDetailPage() {
  const params = useParams()
  const certificateId = params.id as string
  
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load certificate details
  const loadCertificate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use mock data for now
      // const response = await dobHubApi.getCertificateById(certificateId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Find certificate in mock data
      const foundCertificate = mockCertificates.find(cert => cert.id === certificateId)
      
      if (foundCertificate) {
        setCertificate(foundCertificate)
      } else {
        setError('Certificate not found')
      }
    } catch (err) {
      console.error('Error loading certificate:', err)
      setError('Failed to load certificate details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (certificateId) {
      loadCertificate()
    }
  }, [certificateId])

  // Copy certificate URL
  const copyCertificateUrl = () => {
    if (certificate) {
      navigator.clipboard.writeText(generateCertificateShareUrl(certificate.id))
    }
  }

  // Loading skeleton
  const CertificateSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-24" />
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-48" />
          </div>
          <CertificateSkeleton />
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The requested certificate could not be found.'}</p>
            <Button asChild>
              <Link href="/certificates">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Certificates
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const score = calculateCertificateScore(certificate)
  const latestReview = certificate.reviews?.[certificate.reviews.length - 1]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/certificates">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Certificates
            </Link>
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{getDeviceTypeIcon(certificate.deviceType)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{certificate.deviceName}</h1>
                <p className="text-lg text-gray-600">{certificate.manufacturer} • {certificate.model}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(certificate.status)}>
                {getStatusLabel(certificate.status)}
              </Badge>
              {certificate.certification && (
                <>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {certificate.certification.level}
                  </Badge>
                  <Badge variant="outline" className={getScoreColor(certificate.certification.trufaScore)}>
                    <Star className="w-3 h-3 mr-1" />
                    {certificate.certification.trufaScore.toFixed(1)}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button variant="outline" onClick={copyCertificateUrl}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button variant="outline" asChild>
            <a href={generateCertificateShareUrl(certificate.id)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Certificate Details */}
                  <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
              <TabsTrigger value="certification">Certification</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certificate ID</label>
                      <p className="text-sm font-mono">{certificate.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Serial Number</label>
                      <p className="text-sm">{certificate.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Device Type</label>
                      <p className="text-sm">{certificate.deviceType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Year of Manufacture</label>
                      <p className="text-sm">{certificate.yearOfManufacture}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Condition</label>
                      <p className="text-sm">{certificate.condition}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created</label>
                      <p className="text-sm">{formatDate(certificate.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{certificate.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span>{certificate.user.walletAddress.slice(0, 8)}...{certificate.user.walletAddress.slice(-6)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Certification Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Certification Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certification Level</label>
                      <p className="text-lg font-semibold text-yellow-600">{certificate.certification?.level || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Risk Level</label>
                      <p className="text-lg font-semibold text-blue-600">{certificate.certification?.riskLevel || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">TRUFA Score</label>
                      <p className="text-lg font-semibold text-green-600">{certificate.certification?.trufaScore.toFixed(1) || 'N/A'}/100</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Certified By</label>
                      <p className="text-sm font-semibold">{certificate.certification?.certifiedBy || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="specifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{certificate.specifications}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blockchain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Blockchain Verification</CardTitle>
                <CardDescription>On-chain verification data and transaction details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificate.blockchainData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
                        <p className="text-sm font-mono break-all">{certificate.blockchainData.transactionHash}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Block Number</label>
                        <p className="text-sm">{certificate.blockchainData.blockNumber.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Network</label>
                        <p className="text-sm capitalize">{certificate.blockchainData.network}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Verification Status</label>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <Button asChild variant="outline">
                        <a href={certificate.blockchainData.stellarExplorerUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Stellar Explorer
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No blockchain verification data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certification Details</CardTitle>
                <CardDescription>Validation criteria and certification information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {certificate.certification ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Certification Level</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <Badge className="text-lg px-4 py-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                              {certificate.certification.level}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-2">
                              {certificate.certification.level === 'PLATINUM' && 'Highest level of validation and compliance'}
                              {certificate.certification.level === 'GOLD' && 'Premium validation with comprehensive review'}
                              {certificate.certification.level === 'SILVER' && 'Standard validation with good compliance'}
                              {certificate.certification.level === 'BRONZE' && 'Basic validation with essential requirements met'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <Badge className={`text-lg px-4 py-2 ${
                              certificate.certification.riskLevel === 'VERY_LOW' ? 'bg-green-100 text-green-800 border-green-200' :
                              certificate.certification.riskLevel === 'LOW' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              certificate.certification.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              certificate.certification.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-red-100 text-red-800 border-red-200'
                            }`}>
                              {certificate.certification.riskLevel.replace('_', ' ')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">TRUFA Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center">
                            <div className={`text-3xl font-bold ${getScoreColor(certificate.certification.trufaScore)}`}>
                              {certificate.certification.trufaScore.toFixed(1)}
                            </div>
                            <p className="text-sm text-gray-600">out of 100</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Validation Criteria</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certificate.certification.validationCriteria.map((criteria, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{criteria}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Certified By</label>
                          <p className="text-sm">{certificate.certification.certifiedBy}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Certification Date</label>
                          <p className="text-sm">{formatDate(certificate.certification.certificationDate)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No certification data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Information</CardTitle>
                <CardDescription>Financial details are private and not publicly displayed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Financial information is kept private for security and confidentiality reasons.</p>
                  <p className="text-sm mt-2">Only certified validators can access detailed financial data.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Certificate Documents</CardTitle>
                <CardDescription>Download and view related documents</CardDescription>
              </CardHeader>
              <CardContent>
                {certificate.files && certificate.files.length > 0 ? (
                  <div className="space-y-4">
                    {certificate.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{file.filename}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(file.size)} • {file.documentType}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No documents available for this certificate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation Reviews</CardTitle>
                <CardDescription>Expert reviews and validation scores</CardDescription>
              </CardHeader>
              <CardContent>
                {certificate.reviews && certificate.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {certificate.reviews.map((review, index) => (
                      <div key={review.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">Review #{index + 1}</h4>
                            <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                          </div>
                          <Badge variant={review.decision === 'APPROVED' ? 'default' : 'destructive'}>
                            {review.decision}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{review.notes}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Technical Score</label>
                            <p className="text-lg font-semibold">{review.technicalScore}/100</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Regulatory Score</label>
                            <p className="text-lg font-semibold">{review.regulatoryScore}/100</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Financial Score</label>
                            <p className="text-lg font-semibold">{review.financialScore}/100</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Environmental Score</label>
                            <p className="text-lg font-semibold">{review.environmentalScore}/100</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Overall Score</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}>
                                {review.overallScore.toFixed(1)}
                              </span>
                              <span className="text-sm text-gray-500">/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No reviews available for this certificate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 