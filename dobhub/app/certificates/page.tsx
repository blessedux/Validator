"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, Eye, Calendar, MapPin, Building } from 'lucide-react'
import { dobHubApi, type Certificate, type SearchParams } from '@/lib/api/api-client'
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  getStatusLabel, 
  getDeviceTypeIcon,
  truncateText 
} from '@/lib/utils/dobhub-utils'
import { mockCertificates, mockSearchResponse } from '@/lib/utils/mock-data'

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useState<SearchParams>({
    limit: 12,
    offset: 0
  })
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  // Load certificates
  const loadCertificates = async (params: SearchParams = searchParams) => {
    try {
      setLoading(true)
      setError(null)
      
      // Use mock data for now
      // const response = await dobHubApi.getPublicCertificates(params)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Filter mock data based on search params
      let filteredCertificates = [...mockCertificates]
      
      if (params.query) {
        const query = params.query.toLowerCase()
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.deviceName.toLowerCase().includes(query) ||
          cert.manufacturer.toLowerCase().includes(query) ||
          cert.location.toLowerCase().includes(query) ||
          cert.deviceType.toLowerCase().includes(query)
        )
      }
      
      if (params.deviceType) {
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.deviceType.toLowerCase().includes(params.deviceType!.toLowerCase())
        )
      }
      
      if (params.manufacturer) {
        filteredCertificates = filteredCertificates.filter(cert => 
          cert.manufacturer.toLowerCase().includes(params.manufacturer!.toLowerCase())
        )
      }
      
      // Apply pagination
      const start = params.offset || 0
      const end = start + (params.limit || 12)
      const paginatedCertificates = filteredCertificates.slice(start, end)
      
      setCertificates(paginatedCertificates)
      setTotal(filteredCertificates.length)
      setHasMore(end < filteredCertificates.length)
      
    } catch (err) {
      console.error('Error loading certificates:', err)
      setError('Failed to load certificates. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load certificates on mount
  useEffect(() => {
    loadCertificates()
  }, [])

  // Handle search
  const handleSearch = (query: string) => {
    const newParams = { ...searchParams, query, offset: 0 }
    setSearchParams(newParams)
    loadCertificates(newParams)
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchParams, value: string) => {
    // Convert "all" to undefined to clear the filter
    const filterValue = value === "all" ? undefined : value
    const newParams = { ...searchParams, [key]: filterValue, offset: 0 }
    setSearchParams(newParams)
    loadCertificates(newParams)
  }

  // Handle pagination
  const handleLoadMore = () => {
    const newParams = { ...searchParams, offset: (searchParams.offset || 0) + (searchParams.limit || 12) }
    setSearchParams(newParams)
    loadCertificates(newParams)
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificates</h1>
          <p className="text-gray-600">
            Browse all validated DOB Protocol certificates
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search certificates..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Device Type Filter */}
            <div>
              <Select onValueChange={(value) => handleFilterChange('deviceType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Device Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="solar">Solar Panel</SelectItem>
                  <SelectItem value="wind">Wind Turbine</SelectItem>
                  <SelectItem value="battery">Battery Storage</SelectItem>
                  <SelectItem value="grid">Grid Equipment</SelectItem>
                  <SelectItem value="meter">Smart Meter</SelectItem>
                  <SelectItem value="charger">EV Charger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manufacturer Filter */}
            <div>
              <Select onValueChange={(value) => handleFilterChange('manufacturer', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Manufacturer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  <SelectItem value="tesla">Tesla</SelectItem>
                  <SelectItem value="solarcity">SolarCity</SelectItem>
                  <SelectItem value="ge">General Electric</SelectItem>
                  <SelectItem value="siemens">Siemens</SelectItem>
                  <SelectItem value="abb">ABB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `${total} certificates found`}
          </p>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Certificates Grid */}
        {loading && certificates.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CertificateSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <Card key={certificate.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getDeviceTypeIcon(certificate.deviceType)}</span>
                        <div>
                          <CardTitle className="text-lg">
                            {truncateText(certificate.deviceName, 30)}
                          </CardTitle>
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
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {truncateText(certificate.location, 25)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        {certificate.user.walletAddress.slice(0, 8)}...{certificate.user.walletAddress.slice(-6)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(certificate.createdAt)}
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">TRUFA Score:</span>
                          <span className="font-medium">{certificate.certification?.trufaScore.toFixed(1) || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <Button asChild className="w-full mt-4">
                      <Link href={`/certificates/${certificate.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                  {loading ? 'Loading...' : 'Load More Certificates'}
                </Button>
              </div>
            )}

            {/* No Results */}
            {!loading && certificates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 