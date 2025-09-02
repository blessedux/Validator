import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Shield, Eye, CheckCircle, TrendingUp, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
                DOB Hub
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              View and verify DOB Protocol certificates. Explore validated infrastructure 
              projects and their blockchain-verified credentials in our public certificate viewer.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild>
                <Link href="/certificates">
                  <Eye className="w-5 h-5 mr-2" />
                  Browse Certificates
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/search">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="text-sm">
                <Shield className="w-4 h-4 mr-1" />
                Blockchain Verified
              </Badge>
              <Badge variant="outline" className="text-sm">
                <CheckCircle className="w-4 h-4 mr-1" />
                Public Access
              </Badge>
              <Badge variant="outline" className="text-sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                Real-time Data
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore DOB Protocol Certificates
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover validated infrastructure projects and verify their credentials 
              through our comprehensive certificate viewer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Search & Discover</CardTitle>
                <CardDescription>
                  Find certificates by device name, manufacturer, or location. 
                  Advanced filtering and search capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/search">Start Searching</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Verify Authenticity</CardTitle>
                <CardDescription>
                  Verify certificate authenticity with blockchain verification. 
                  Real-time validation and status checking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/verify">Verify Certificate</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Browse All</CardTitle>
                <CardDescription>
                  Browse all public certificates. View detailed information, 
                  specifications, and validation history.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/certificates">Browse Certificates</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              DOB Protocol Network
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of validated infrastructure projects
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">Certificates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Validators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">Manufacturers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Explore Certificates?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start browsing validated infrastructure projects and verify their 
            blockchain-verified credentials today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/certificates">
                <Eye className="w-5 h-5 mr-2" />
                Browse Certificates
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/search">
                <Search className="w-5 h-5 mr-2" />
                Search Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
