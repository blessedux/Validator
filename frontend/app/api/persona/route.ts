import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { storeChallenge, getDebugInfo } from '@/lib/auth-storage'
import { getSafeBackendUrl } from '@/lib/api-utils'

// Required for API routes in Next.js
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    if (!request.body) {
      console.error('No request body found')
      return NextResponse.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    console.log('Persona response', body)   
    
    // Get the backend URL safely
    const backendUrl = getSafeBackendUrl()
    const backendResponse = await fetch(`https://localhost:4000/webhook/persona`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body
      })
    })
    
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error('Backend personas request failed', backendResponse.status, errorText)
      return NextResponse.json(
        { error: 'Backend personas request failed' },
        { status: backendResponse.status }
      )
    }
    
    const backendData = await backendResponse.json()
    console.log('Backend personas received:', backendData)
    
  } catch (error) {
    console.error('Error pesonas request:', error)
    
    // Provide more specific error information
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: 'Internal server error', message: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Debug endpoint to check stored challenges
export async function GET(request: NextRequest) {
  try {
    const debugInfo = getDebugInfo()
    return NextResponse.json({
      success: true,
      debug: debugInfo,
      message: 'Debug information retrieved'
    })
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 