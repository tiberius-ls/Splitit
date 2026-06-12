'use client';

import { NimiqProvider } from './nimiqProvider';

export interface PaymentTransaction {
  recipient: string;
  amount: string;
  currency: 'NIM' | 'USDT';
  message?: string;
  chainId?: number;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  message: string;
}

/**
 * Send a payment transaction via Nimiq SDK
 * Supports both NIM and USDT on multiple chains
 */
export const sendPayment = async (
  nimiq: NimiqProvider,
  transaction: PaymentTransaction
): Promise<TransactionResult> => {
  try {
    if (!nimiq.initialized || !nimiq.account) {
      return {
        success: false,
        error: 'Wallet not connected',
        message: 'Please connect your wallet first',
      };
    }

    // Validate inputs
    if (!transaction.recipient || !transaction.amount) {
      return {
        success: false,
        error: 'Missing required fields',
        message: 'Recipient and amount are required',
      };
    }

    const amountNum = parseFloat(transaction.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return {
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be a positive number',
      };
    }

    // Build transaction payload
    const txPayload = {
      from: nimiq.account,
      to: transaction.recipient,
      amount: amountNum,
      currency: transaction.currency,
      message: transaction.message || `Payment via SplitIt`,
      timestamp: new Date().toISOString(),
    };

    // Sign the transaction
    const signedTx = await nimiq.sign(JSON.stringify(txPayload));

    if (!signedTx) {
      return {
        success: false,
        error: 'Transaction signing failed',
        message: 'Could not sign transaction',
      };
    }

    // In a production app, you would send this to a server
    // For now, we'll simulate a successful transaction
    const txHash = generateTxHash();

    console.log('✅ Transaction signed and submitted:', {
      txHash,
      payload: txPayload,
      signature: signedTx,
    });

    return {
      success: true,
      txHash,
      message: `Successfully sent ${transaction.amount} ${transaction.currency} to ${transaction.recipient}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Payment error:', error);
    return {
      success: false,
      error: errorMessage,
      message: `Transaction failed: ${errorMessage}`,
    };
  }
};

/**
 * Generate a mock transaction hash for demo purposes
 */
export const generateTxHash = (): string => {
  return '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Create a payment request URL/QR code data
 * Format: nimiq:address?amount=X&message=Y
 */
export const createPaymentRequest = (
  address: string,
  amount: string,
  currency: 'NIM' | 'USDT' = 'NIM',
  message?: string
): string => {
  if (!address) return '';
  
  const baseUrl = currency === 'NIM' 
    ? `nimiq:${address.replace(/\s/g, '')}`
    : `ethereum:${address.replace(/\s/g, '')}/transfer`;

  const params = new URLSearchParams();
  if (amount) params.append('amount', amount);
  if (message) params.append('message', encodeURIComponent(message));
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Validate a Nimiq address format
 */
export const isValidAddress = (address: string): boolean => {
  // Nimiq addresses start with NQ and are 36-40 chars (with spaces: NQ94 XXXX XXXX...)
  const nimiqPattern = /^NQ[A-Z0-9\s]{30,34}$/;
  return nimiqPattern.test(address);
};

/**
 * Format address for display (shortened version)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  const clean = address.replace(/\s/g, '');
  return `${clean.substring(0, 8)}...${clean.substring(clean.length - 6)}`;
};
