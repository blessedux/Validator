import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export function DOBHubFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">DOB Hub</h3>
                <p className="text-sm text-gray-500">Certificate Public Viewer</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-md">
              View and verify DOB Protocol certificates. Explore validated infrastructure 
              projects and their blockchain-verified credentials.
            </p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Powered by DOB Protocol
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Blockchain Verified
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/certificates" className="text-sm text-gray-600 hover:text-gray-900">
                  Browse Certificates
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">
                  Search
                </Link>
              </li>
              <li>
                <Link href="/verify" className="text-sm text-gray-600 hover:text-gray-900">
                  Verify Certificate
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://dobprotocol.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  DOB Protocol
                </a>
              </li>
              <li>
                <a 
                  href="https://docs.dobprotocol.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/dobprotocol" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © 2024 DOB Protocol. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
              Terms of Service
            </Link>
            <Link href="/api" className="text-sm text-gray-500 hover:text-gray-900">
              API
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 