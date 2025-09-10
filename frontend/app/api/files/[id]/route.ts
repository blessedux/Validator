import { NextRequest, NextResponse } from 'next/server'

// Required for API routes in Next.js
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 Frontend file serve request for ID:', id)
    
    // Get the backend URL
    const { getSafeBackendUrl } = await import('../../../../lib/api-utils')
    let backendUrl = getSafeBackendUrl()
    console.log('🔍 [File Serve] Initial backendUrl from getSafeBackendUrl:', backendUrl)

    // Final fallback: if still on the frontend domain, force the backend URL
    if (backendUrl.includes('validator.dobprotocol.com')) {
      console.log('🔍 [File Serve] Forcing backend URL to v.dobprotocol.com')
      backendUrl = 'https://v.dobprotocol.com'
    }
    
    const fileUrl = `${backendUrl}/api/files/${id}`
    console.log('🔍 [File Serve] Final fileUrl:', fileUrl)

    // Forward the request to the backend
    const backendResponse = await fetch(fileUrl, {
      method: 'GET',
      headers: {
        'Accept': '*/*'
      }
    })

    console.log('🔍 [File Serve] Backend response status:', backendResponse.status)
    
    if (!backendResponse.ok) {
      console.error('❌ [File Serve] Backend error response:', backendResponse.status)
      return new NextResponse('File not found', { status: 404 })
    }

    // Get the file data and content type
    const fileBuffer = await backendResponse.arrayBuffer()
    const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream'
    
    console.log('🔍 [File Serve] File served successfully, content-type:', contentType)

    // Return the file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error('❌ [File Serve] Proxy error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
