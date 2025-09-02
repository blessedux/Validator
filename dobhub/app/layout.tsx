import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { DOBHubHeader } from '@/components/layout/dobhub-header'
import { DOBHubFooter } from '@/components/layout/dobhub-footer'

export const metadata: Metadata = {
  title: 'DOB Hub - Certificate Public Viewer',
  description: 'View and verify DOB Protocol certificates. Explore validated infrastructure projects and their blockchain-verified credentials.',
  keywords: 'DOB Protocol, certificates, verification, blockchain, infrastructure, validation',
  authors: [{ name: 'DOB Protocol' }],
  creator: 'DOB Protocol',
  publisher: 'DOB Protocol',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hub.dobprotocol.com'),
  openGraph: {
    title: 'DOB Hub - Certificate Public Viewer',
    description: 'View and verify DOB Protocol certificates',
    url: 'https://hub.dobprotocol.com',
    siteName: 'DOB Hub',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DOB Hub - Certificate Public Viewer',
    description: 'View and verify DOB Protocol certificates',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          <DOBHubHeader />
          <main className="flex-1">
            {children}
          </main>
          <DOBHubFooter />
        </div>
      </body>
    </html>
  )
}
