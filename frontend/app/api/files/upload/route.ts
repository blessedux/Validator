import { NextRequest, NextResponse } from 'next/server'

// Required for API routes in Next.js
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Frontend file upload proxy request received')
    
    // Get the backend URL
    const { getSafeBackendUrl } = await import('../../../../lib/api-utils')
    let backendUrl = getSafeBackendUrl()
    console.log('🔍 [File Upload] Initial backendUrl from getSafeBackendUrl:', backendUrl)

    // Final fallback: if still on the frontend domain, force the backend URL
    if (backendUrl.includes('validator.dobprotocol.com')) {
      console.log('🔍 [File Upload] Forcing backend URL to v.dobprotocol.com')
      backendUrl = 'https://v.dobprotocol.com'
    }
    
    const uploadUrl = `${backendUrl}/api/files/upload`
    console.log('🔍 [File Upload] Final uploadUrl:', uploadUrl)

    // Get the FormData from the request
    const formData = await request.formData()
    console.log('🔍 [File Upload] FormData received, keys:', Array.from(formData.keys()))

    // Forward the request to the backend
    const backendResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })

    console.log('🔍 [File Upload] Backend response status:', backendResponse.status)
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('❌ [File Upload] Backend error response:', errorText)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend upload failed',
          details: errorText
        },
        { status: backendResponse.status }
      )
    }

    const responseData = await backendResponse.json()
    console.log('🔍 [File Upload] Backend response data:', responseData)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('❌ [File Upload] Proxy error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'File upload proxy failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
