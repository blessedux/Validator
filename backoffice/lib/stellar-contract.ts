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

class StellarContractService {
  createTrufaMetadata(params: {
    submissionId: string;
    deviceName: string;
    deviceType: string;
    operatorWallet: string;
    validatorWallet: string;
    trufaScores: {
      technical: number;
      regulatory: number;
      financial: number;
      environmental: number;
      overall: number;
    };
    decision: 'APPROVED' | 'REJECTED';
  }) {
    return {
      submissionId: params.submissionId,
      deviceName: params.deviceName,
      deviceType: params.deviceType,
      operatorWallet: params.operatorWallet,
      validatorWallet: params.validatorWallet,
      trufaScores: params.trufaScores,
      decision: params.decision,
      timestamp: Date.now(),
      version: '1.0',
      network: 'testnet'
    };
  }

  async initialize() {
    console.log('Stellar Contract Service initialized');
    return true;
  }

  async submitValidationToSoroban(params: {
    adminPublic: string;
    metadata: any;
    signTransaction: (xdr: string) => Promise<string>;
  }) {
    try {
    // REPLACE WITH REAL SUMBIT TO SOROBAN
      console.log('Submitting validation to Soroban contract...');

      const transactionHash = `testHash-123`;      
      return {
        success: true,
        transactionHash,
        metadata: params.metadata
      };
    } catch (error) {
      console.error('Error submitting to Soroban:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export stellarContractService instance
export const stellarContractService = new StellarContractService();