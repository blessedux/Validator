import { Keypair, TransactionBuilder, Networks, Operation, Asset, Account } from "@stellar/stellar-sdk";
import { freighterService } from './freighter-service';
import { rpc as StellarRpc } from "@stellar/stellar-sdk";

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

  private async generateFreighterXDR(adminPublic: string, metadata: any): Promise<string> {
    const server = new StellarRpc.Server("https://soroban-testnet.stellar.org");

    try {
      const account = await server.getAccount(adminPublic);

      const transaction = new TransactionBuilder(account, {
        fee: "1",
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(
          Operation.manageData({
            name: `trufa_validation_${metadata.submissionId}`,
            value: JSON.stringify(metadata.submissionId)
          })
        )
        .setTimeout(30)
        .build();

      return transaction.toXDR();
    } catch (error) {
      console.error('Error getting account or building transaction:', error);
      throw new Error(`Failed to build transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitValidationToSoroban(params: {
    adminPublic: string;
    metadata: any;
    signTransaction: (xdr: string) => Promise<string>;
  }) {
    try {
      const accessGranted = await freighterService.requestAccess();
      if (!accessGranted) {
        throw new Error("Freighter access was denied by user");
      }

      console.log("Freighter access granted");
      console.log('Admin public key:', params.adminPublic);
      console.log('Metadata:', params.metadata);

      const preStellar = await this.generateFreighterXDR(params.adminPublic, params.metadata);
      console.log('XDR prestellar sign', preStellar);

      const postStellar = await params.signTransaction(preStellar);
      const server = new StellarRpc.Server("https://soroban-testnet.stellar.org");
      const tx = TransactionBuilder.fromXDR(postStellar, Networks.TESTNET);

      const txResponse = await server.sendTransaction(tx);
      if (txResponse.status === 'PENDING') {
        console.log('Transaction pending, waiting for confirmation...');
        const confirmedTx = await server.getTransaction(txResponse.hash);
        console.log('Transaction confirmed:', confirmedTx);
      }

      console.log("Soroban transaction response:", txResponse);
      console.log('Signed XDR:', postStellar || "No XDR returned");
      console.log('Transaction hash:', txResponse.hash || "No hash returned");

      return {
        success: txResponse.status !== 'ERROR',
        metadata: params.metadata,
        transactionHash: txResponse.hash,
        transactionUrl: `https://stellar.expert/explorer/testnet/tx/${txResponse.hash}`,
        status: txResponse.status
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

export const stellarContractService = new StellarContractService();