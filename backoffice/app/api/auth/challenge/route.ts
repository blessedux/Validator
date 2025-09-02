import { NextRequest, NextResponse } from 'next/server'
import { adminConfigService } from '@/lib/admin-config'

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Check if the wallet is an admin (or if we're in MVP mode)
    const adminWallet = adminConfigService.getAdminWallet(walletAddress)
    if (!adminWallet) {
      return NextResponse.json(
        { error: 'Unauthorized: Wallet is not an admin' },
        { status: 403 }
      )
    }

    // Get challenge from backend instead of generating our own
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/auth/challenge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ walletAddress }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Backend challenge error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get challenge from backend' },
        { status: response.status }
      )
    }

    const backendData = await response.json()

    return NextResponse.json({ 
      challenge: backendData.challenge,
      walletAddress,
      role: adminWallet.role,
      permissions: adminWallet.permissions
    })
  } catch (error) {
    console.error('Challenge generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 