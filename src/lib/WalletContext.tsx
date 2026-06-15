'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getProvider,
  isInNimiqPay,
  isErrorResponse,
  type NimiqProvider,
} from './nimiqProvider';

interface ChainInfo {
  consensus: boolean | null;
  blockNumber: number | null;
}

interface WalletContextType {
  provider: NimiqProvider | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  /** True only when running inside the Nimiq Pay WebView. */
  inNimiqPay: boolean;
  accounts: string[];
  activeAccount: string | null;
  chain: ChainInfo;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Refresh consensus + block height from the host. */
  refreshChain: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<NimiqProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inNimiqPay, setInNimiqPay] = useState(false);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);
  const [chain, setChain] = useState<ChainInfo>({ consensus: null, blockNumber: null });

  const refreshChain = useCallback(async () => {
    try {
      const p = await getProvider();
      const [consensus, blockNumber] = await Promise.all([
        p.isConsensusEstablished().catch(() => null),
        p.getBlockNumber().catch(() => null),
      ]);
      setChain({ consensus, blockNumber });
    } catch {
      // Provider unavailable — leave chain info as-is.
    }
  }, []);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getProvider();
      // listAccounts() triggers the native consent dialog and caches the accounts.
      const result = await p.listAccounts();
      if (isErrorResponse(result)) {
        throw new Error(result.error.message || 'Account access was denied');
      }
      setProvider(p);
      setConnected(true);
      setAccounts(result);
      setActiveAccount(result[0] ?? null);
      void refreshChain();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      setConnected(false);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  }, [refreshChain]);

  const disconnect = useCallback(() => {
    provider?.disconnect();
    setProvider(null);
    setConnected(false);
    setAccounts([]);
    setActiveAccount(null);
    setError(null);
  }, [provider]);

  // Detect the host once on mount. We do NOT auto-request accounts — account
  // access requires explicit user consent, so we wait for a deliberate connect.
  useEffect(() => {
    setInNimiqPay(isInNimiqPay());
  }, []);

  return (
    <WalletContext.Provider
      value={{
        provider,
        connected,
        loading,
        error,
        inNimiqPay,
        accounts,
        activeAccount,
        chain,
        connect,
        disconnect,
        refreshChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
