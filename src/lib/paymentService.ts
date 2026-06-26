'use client';

import { isErrorResponse, nimToLunas, type NimiqProvider } from './nimiqProvider';

export interface PaymentTransaction {
  recipient: string;
  /** Amount in NIM (human units). Converted to Lunas before sending. */
  amount: string;
  message?: string;
}

export interface TransactionResult {
  success: boolean;
  /** Serialized transaction returned by the wallet. */
  tx?: string;
  error?: string;
  message: string;
}

/**
 * Encode a UTF-8 string to a hex string for an on-chain transaction message.
 */
const toHex = (text: string): string =>
  Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/**
 * Send a real NIM payment through Nimiq Pay. Nimiq Pay shows a native
 * confirmation dialog; the user's keys never leave the wallet.
 *
 * USDT / EVM transfers are not handled here — they would go through
 * `window.ethereum`, which this mini-app does not yet implement.
 */
export const sendPayment = async (
  provider: NimiqProvider,
  transaction: PaymentTransaction,
): Promise<TransactionResult> => {
  // Validate inputs
  const cleanRecipient = transaction.recipient?.trim();
  if (!cleanRecipient) {
    return { success: false, error: 'Missing recipient', message: 'A recipient address is required' };
  }
  if (!isValidAddress(cleanRecipient)) {
    return { success: false, error: 'Invalid address', message: 'Recipient is not a valid Nimiq address' };
  }

  const amountNum = parseFloat(transaction.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { success: false, error: 'Invalid amount', message: 'Amount must be a positive number' };
  }

  try {
    const value = nimToLunas(amountNum);
    const message = transaction.message?.trim();

    const result = message
      ? await provider.sendBasicTransactionWithData({
          recipient: cleanRecipient,
          value,
          data: toHex(message),
        })
      : await provider.sendBasicTransaction({ recipient: cleanRecipient, value });

    if (isErrorResponse(result)) {
      return {
        success: false,
        error: result.error.type,
        message: result.error.message || 'The wallet rejected the transaction',
      };
    }

    return {
      success: true,
      tx: result,
      message: `Sent ${amountNum} NIM to ${formatAddress(cleanRecipient)}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Payment error:', error);
    return { success: false, error: errorMessage, message: `Transaction failed: ${errorMessage}` };
  }
};

/**
 * Validate a Nimiq address (NQ + 2 check digits + 32 base32 chars, optionally
 * grouped in 4s by spaces).
 */
export const isValidAddress = (address: string): boolean => {
  const clean = address.replace(/\s/g, '').toUpperCase();
  return /^NQ[0-9]{2}[0-9A-Z]{32}$/.test(clean);
};

/**
 * Format an address for display (shortened).
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  const clean = address.replace(/\s/g, '');
  if (clean.length <= 14) return clean;
  return `${clean.substring(0, 8)}…${clean.substring(clean.length - 6)}`;
};
