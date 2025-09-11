import { Keypair, TransactionBuilder, Networks, Operation, Asset, Account, Contract, Address, nativeToScVal } from "@stellar/stellar-sdk";
import { freighterService } from './freighter-service';
import { rpc as StellarRpc } from "@stellar/stellar-sdk";

const publicId = 'CBD33YTADJSQHRVPKUJPVKJZBGGXBWJ5WW44MUPEQ4XUXBSO6LEKZ724';

class StellarContractService {
  private publicId = publicId;

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
    console.log('Using contract ID:', this.publicId);
    console.log('Using contract ID:', publicId);
    return true;
  }

  private async generateFreighterXDR(adminPublic: string, metadata: any): Promise<string> {
    const server = new StellarRpc.Server("https://soroban-testnet.stellar.org");
    if (!this.publicId) {
      throw new Error("STELLAR_CONTRACT_ID environment variable is not set.");
    }
    const contract = new Contract(this.publicId);
    try {
      const account = await server.getAccount(adminPublic);
      const fromAddressScVal = Address.fromString(adminPublic).toScVal();


      // CHECK PROJECT VALUES --> DECISION IS NECESARY(?)
      const projectHashString = JSON.stringify({
        submissionId: metadata.submissionId,
        deviceName: metadata.deviceName,
        timestamp: metadata.timestamp,
        decision: metadata.decision
      });

      const encoder = new TextEncoder();
      // Hash the project data using SHA-256 --> 32 BITS
      const data = encoder.encode(projectHashString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const projectHash = new Uint8Array(hashBuffer);

      const projectHashScVal = nativeToScVal(projectHash, { type: "bytes" });

      // CREATE TRANSACTION
      // REPLACE FEE WITH DYNAMIC FEE LATER
      const transaction = new TransactionBuilder(account, {
        fee: "10000000",
        networkPassphrase: Networks.TESTNET,
      })
        // CREATE CONTRACT
        .addOperation(
          contract.call(
            "add_project",
            fromAddressScVal,
            projectHashScVal
          )
        )
        .setTimeout(300)
        .build();

      // PREPARE TRANSACTION
      const preparedTransaction = await server.prepareTransaction(transaction);
      return preparedTransaction.toXDR();

    } catch (error) {
      console.error('Error getting account or building transaction:', error);

      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        throw new Error(`Account not funded: Your wallet ${adminPublic} needs to be funded on Stellar testnet. Please visit https://laboratory.stellar.org/#account-creator?network=testnet and fund your account with testnet XLM.`);
      }

      throw new Error(`Failed to build transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async submitValidationToSoroban(params: {
    adminPublic: string;
    metadata: any;
    signTransaction: (xdr: string) => Promise<string>;
  }) {
    try {
      // CHECK FREIGHTER ACCESS
      const accessGranted = await freighterService.requestAccess();
      if (!accessGranted) {
        throw new Error("Freighter access was denied by user");
      }

      console.log("Freighter access granted");
      console.log('Admin public key:', params.adminPublic);
      console.log('Metadata:', params.metadata);


      const preStellar = await this.generateFreighterXDR(params.adminPublic, params.metadata);
      console.log('XDR prestellar sign', preStellar);

      // SIGN TRANSACTION
      const postStellar = await params.signTransaction(preStellar);
      console.log('Signed XDR:', postStellar);

      let signedTransaction;
      try {
        signedTransaction = TransactionBuilder.fromXDR(postStellar, Networks.TESTNET);
        console.log('XDR parsed successfully');
      } catch (xdrError) {
        console.error('Error parsing signed XDR:', xdrError);
        throw new Error(`Invalid signed transaction XDR: ${xdrError instanceof Error ? xdrError.message : 'Unknown XDR error'}`);
      }

      const server = new StellarRpc.Server("https://soroban-testnet.stellar.org");

      let txResponse;
      try {
        // SEND TRANSACTION
        txResponse = await server.sendTransaction(signedTransaction);
        console.log('Transaction sent successfully:', txResponse);
      } catch (sendError) {
        console.error('Error sending transaction:', sendError);
        throw new Error(`Failed to send transaction: ${sendError instanceof Error ? sendError.message : 'Unknown send error'}`);
      }

      if (txResponse.hash) {
        console.log("Transaction submitted successfully with hash:", txResponse.hash);

        if (txResponse.status === 'PENDING') {
          console.log('Transaction is pending confirmation...');
        }
        return {
          success: true,
          metadata: params.metadata,
          transactionHash: txResponse.hash,
          transactionUrl: `https://stellar.expert/explorer/testnet/tx/${txResponse.hash}`,
          status: txResponse.status || 'SUBMITTED'
        };
      } else {
        throw new Error("Transaction was not submitted properly - no hash received");
      }

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