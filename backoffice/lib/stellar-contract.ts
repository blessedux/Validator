/**
 * Stellar contract utilities for DOB Validator Backoffice
 * Updated to use Freighter wallet integration
 */

import { freighterService } from './freighter-service'

// Re-export freighterService for compatibility
export { freighterService }

// Export the signTransaction method directly for compatibility
export const signTransactionWithFreighter = freighterService.signTransaction.bind(freighterService)
export const signTransactionWithSimpleSigner = freighterService.signTransaction.bind(freighterService)

// Export stellarContractService for backward compatibility
export const stellarContractService = freighterService 