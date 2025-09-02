"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  QrCode, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Copy,
  ExternalLink,
  Eye
} from 'lucide-react'
import { dobHubApi, type Certificate } from '@/lib/api/api-client'
import { 
  formatDate, 
  getStatusColor, 
  getStatusLabel, 
  getDeviceTypeIcon,
  generateCertificateShareUrl,
  getVerificationMessage,
  isValidCertificateId
} from '@/lib/utils/dobhub-utils'
import { mockCertificates } from '@/lib/utils/mock-data'

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState('')
  const [certificate, setCertificate] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  // Verify certificate
  const verifyCertificate = async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a certificate ID')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCertificate(null)
      setIsValid(null)

      // Use mock data for now
      // const response = await dobHubApi.verifyCertificate(id.trim())
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Find certificate in mock data
      const foundCertificate = mockCertificates.find(cert => 
        cert.id.toLowerCase() === id.trim().toLowerCase()
      )
      
      if (foundCertificate) {
        setIsValid(true)
        setCertificate(foundCertificate)
      } else {
        setIsValid(false)
        setError('Certificate not found. Please check the ID and try again.')
      }
      
    } catch (err) {
      console.error('Verification error:', err)
      setError('Verification failed. Please check the certificate ID and try again.')
      setIsValid(false)
    } finally {
      setLoading(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyCertificate(certificateId)
  }

  // Copy certificate URL
  const copyCertificateUrl = () => {
    if (certificate) {
      navigator.clipboard.writeText(generateCertificateShareUrl(certificate.id))
    }
  }

  // Loading skeleton
  const CertificateSkeleton = () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Certificate</h1>
          <p className="text-gray-600">
            Verify the authenticity of DOB Protocol certificates using certificate ID or QR code
          </p>
        </div>

        {/* Verification Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <Tabs defaultValue="id" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="id">Certificate ID</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>

            <TabsContent value="id" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Certificate ID
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter certificate ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={loading || !certificateId.trim()}>
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the certificate ID to verify its authenticity
                  </p>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center py-8">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">
                  QR code scanning functionality coming soon
                </p>
                <p className="text-sm text-gray-500">
                  For now, please use the Certificate ID tab to verify certificates
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            <CertificateSkeleton />
          </div>
        )}

        {error && !loading && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isValid === false && !loading && !certificate && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This certificate could not be verified. It may be invalid, expired, or no longer active.
            </AlertDescription>
          </Alert>
        )}

        {certificate && !loading && (
          <div className="space-y-6">
            {/* Verification Status */}
            <Alert className={isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={isValid ? "text-green-800" : "text-red-800"}>
                {getVerificationMessage(isValid, certificate)}
              </AlertDescription>
            </Alert>

            {/* Certificate Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{getDeviceTypeIcon(certificate.deviceType)}</span>
                    <div>
                      <CardTitle className="text-xl">{certificate.deviceName}</CardTitle>
                      <CardDescription>
                        {certificate.manufacturer} • {certificate.model}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(certificate.status)}>
                    {getStatusLabel(certificate.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Certificate ID:</span>
                        <span className="font-mono text-sm">{certificate.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Device Type:</span>
                        <span>{certificate.deviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Serial Number:</span>
                        <span>{certificate.serialNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span>{certificate.location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Year of Manufacture:</span>
                        <span>{certificate.yearOfManufacture}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Condition:</span>
                        <span>{certificate.condition}</span>
                      </div>
                    </div>
                  </div>

                                     {/* Certification Information */}
                   <div className="space-y-4">
                     <h3 className="font-semibold text-gray-900">Certification Information</h3>
                     <div className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Certification Level:</span>
                         <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                           {certificate.certification?.level || 'N/A'}
                         </Badge>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Risk Level:</span>
                         <span className="font-medium">{certificate.certification?.riskLevel.replace('_', ' ') || 'N/A'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">TRUFA Score:</span>
                         <span className={`font-medium ${getScoreColor(certificate.certification?.trufaScore || 0)}`}>
                           {certificate.certification?.trufaScore.toFixed(1) || 'N/A'}/100
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Certified By:</span>
                         <span className="font-medium">{certificate.certification?.certifiedBy || 'N/A'}</span>
                       </div>
                     </div>
                   </div>
                </div>

                                 {/* Specifications */}
                 {certificate.specifications && (
                   <div className="mt-6 pt-6 border-t border-gray-200">
                     <h3 className="font-semibold text-gray-900 mb-3">Specifications</h3>
                     <p className="text-gray-600 text-sm whitespace-pre-wrap">
                       {certificate.specifications}
                     </p>
                   </div>
                 )}

                 {/* Blockchain Verification */}
                 {certificate.blockchainData && (
                   <div className="mt-6 pt-6 border-t border-gray-200">
                     <h3 className="font-semibold text-gray-900 mb-3">Blockchain Verification</h3>
                     <div className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Transaction Hash:</span>
                         <span className="font-mono text-sm">{certificate.blockchainData.transactionHash.slice(0, 16)}...</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Block Number:</span>
                         <span className="font-medium">{certificate.blockchainData.blockNumber.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Network:</span>
                         <span className="font-medium capitalize">{certificate.blockchainData.network}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Status:</span>
                         <Badge className="bg-green-100 text-green-800 border-green-200">
                           <CheckCircle className="w-3 h-3 mr-1" />
                           Verified
                         </Badge>
                       </div>
                     </div>
                     <div className="mt-4">
                       <Button variant="outline" size="sm" asChild>
                         <a href={certificate.blockchainData.stellarExplorerUrl} target="_blank" rel="noopener noreferrer">
                           <ExternalLink className="w-4 h-4 mr-2" />
                           View on Stellar Explorer
                         </a>
                       </Button>
                     </div>
                   </div>
                 )}

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/certificates/${certificate.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Details
                    </Link>
                  </Button>
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
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Verify a Certificate</CardTitle>
            <CardDescription>
              Learn how to verify the authenticity of DOB Protocol certificates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Find the Certificate ID</h4>
                  <p className="text-sm text-gray-600">
                    Locate the certificate ID from the certificate document or QR code
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Enter the ID</h4>
                  <p className="text-sm text-gray-600">
                    Paste or type the certificate ID in the verification field above
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Verify Authenticity</h4>
                  <p className="text-sm text-gray-600">
                    Click verify to check if the certificate is authentic and active
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 