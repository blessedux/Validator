#!/usr/bin/env ts-node

import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function updateAdminRole(walletAddress: string) {
  try {
    console.log('🔧 Updating admin user role for wallet:', walletAddress)
    
    const adminUser = await prisma.user.upsert({
      where: { walletAddress },
      update: { 
        role: Role.ADMIN,
        updatedAt: new Date()
      },
      create: {
        walletAddress,
        role: Role.ADMIN
      }
    })

    console.log('✅ Updated admin user:', adminUser)
  } catch (error) {
    console.error('❌ Error updating admin role:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get wallet address from command line argument
const walletAddress = process.argv[2]
if (!walletAddress) {
  console.error('❌ Please provide a wallet address as argument')
  process.exit(1)
}

// Run if this file is executed directly
if (require.main === module) {
  updateAdminRole(walletAddress)
}

export { updateAdminRole }