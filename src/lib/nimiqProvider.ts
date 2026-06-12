'use client';

import { init } from '@nimiq/mini-app-sdk';

export interface NimiqProvider {
  initialized: boolean;
  accounts: string[];
  account: string | null;
  listAccounts: () => Promise<string[]>;
  sign: (message: string) => Promise<any>;
}

let nimiqInstance: NimiqProvider | null = null;

const isErrorResponse = (response: any): response is { error: string } => {
  return response && typeof response === 'object' && 'error' in response;
};

export const initNimiq = async (): Promise<NimiqProvider> => {
  if (nimiqInstance?.initialized) {
    return nimiqInstance;
  }

  try {
    const sdk = await init();
    
    if (!sdk) {
      throw new Error('Failed to initialize Nimiq SDK');
    }

    // Get available accounts
    const accountsResponse = await sdk.listAccounts();
    const accounts = isErrorResponse(accountsResponse) ? [] : (Array.isArray(accountsResponse) ? accountsResponse : []);
    
    nimiqInstance = {
      initialized: true,
      accounts: accounts,
      account: accounts?.[0] || null,
      listAccounts: async () => {
        const updatedResponse = await sdk.listAccounts();
        const updatedAccounts = isErrorResponse(updatedResponse) ? [] : (Array.isArray(updatedResponse) ? updatedResponse : []);
        if (nimiqInstance) {
          nimiqInstance.accounts = updatedAccounts;
          nimiqInstance.account = updatedAccounts?.[0] || null;
        }
        return updatedAccounts;
      },
      sign: (message: string) => sdk.sign(message),
    };

    return nimiqInstance;
  } catch (error) {
    console.error('Failed to initialize Nimiq:', error);
    throw error;
  }
};

export const getNimiq = (): NimiqProvider | null => {
  return nimiqInstance;
};

export const resetNimiq = () => {
  nimiqInstance = null;
};
