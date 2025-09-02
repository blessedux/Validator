import './globals.css'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Footer } from '@/components/ui/footer'
import { StarsBackground } from '@/components/ui/stars-background'
import { Header } from '@/components/ui/header'
import Script from 'next/script'
import { LoadingScreen } from '../components/loading-screen'

export const metadata: Metadata = {
  title: 'DOB Validator',
  description: 'Device Ownership Blockchain Validator',
  metadataBase: new URL('https://validator.dobprotocol.com'),
  openGraph: {
    title: 'DOB Validator',
    description: 'Device Ownership Blockchain Validator',
    siteName: 'DOB Validator',
  },
}

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      style={{
        backgroundColor: 'transparent',
        color: 'hsl(var(--foreground))',
        opacity: 0,
        visibility: 'hidden'
      }}
    >
      <head>
        {/* CRITICAL: Inline styles to hide everything immediately */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              background-color: transparent !important;
              color: hsl(var(--foreground)) !important;
              opacity: 0 !important;
              visibility: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            html.js-ready, html.js-ready body {
              opacity: 1 !important;
              visibility: visible !important;
              transition: opacity 0.8s ease-in-out;
            }
            main {
              opacity: 0 !important;
              transition: opacity 0.8s ease-in-out !important;
              z-index: 10000 !important;
            }
            html.js-ready main {
              opacity: 1 !important;
            }
            [data-slot="stars-background"], [data-slot="star-layer"], [data-loading-screen] {
              opacity: 1 !important;
              visibility: visible !important;
            }
          `
        }} />
        {/* CRITICAL: Add js-ready class after a delay to coordinate with preloader */}
        <Script id="prevent-flash" strategy="beforeInteractive">
          {`
            (function() {
              console.log('🔄 Starting preloader coordination...');
              // Delay adding js-ready class to coordinate with preloader fade-out
              setTimeout(function() {
                console.log('✨ Adding js-ready class for content fade-in');
                document.documentElement.classList.add('js-ready');
              }, 800);
            })();
          `}
        </Script>
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/stellar-freighter-api/4.1.0/index.min.js" />
        <Script id="freighter-check" strategy="afterInteractive">
          {`
            console.log('🔍 Checking Freighter API availability...');
            if (typeof window !== 'undefined') {
              console.log('✅ Freighter API loaded successfully');
              console.log('Freighter API available:', !!window.freighterApi);
              if (window.freighterApi) {
                console.log('Freighter API methods:', Object.keys(window.freighterApi));
              }
            }
          `}
        </Script>
        {/* Force cache refresh for drafts fix */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body 
        className="min-h-screen"
        style={{
          backgroundColor: 'transparent',
          color: 'hsl(var(--foreground))',
          opacity: 0,
          visibility: 'hidden'
        }}
      >
        {/* CRITICAL: Inline script to add js-ready class after delay */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              console.log('🔄 Starting preloader coordination (inline)...');
              // Delay adding js-ready class to coordinate with preloader fade-out
              setTimeout(function() {
                console.log('✨ Adding js-ready class for content fade-in (inline)');
                document.documentElement.classList.add('js-ready');
              }, 800);
            })();
          `
        }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LoadingScreen />
          <div className="relative min-h-screen overflow-hidden">
            {/* Main Stars Background */}
            <StarsBackground 
              className="!fixed inset-0 -z-10 pointer-events-none" 
              style={{ 
                opacity: 1, 
                visibility: 'visible',
                backgroundColor: 'transparent'
              }}
              factor={0.1}
              speed={40}
            />
            <Header />
            <main className="relative z-10">
              {children}
            </main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
// Cache bust: Fri Jul  4 23:24:11 -04 2025
