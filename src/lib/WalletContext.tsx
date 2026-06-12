'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initNimiq, getNimiq, NimiqProvider } from './nimiqProvider';

interface WalletContextType {
  nimiq: NimiqProvider | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  accounts: string[];
  activeAccount: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [nimiq, setNimiq] = useState<NimiqProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [activeAccount, setActiveAccount] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = await initNimiq();
      setNimiq(provider);
      setConnected(true);
      setAccounts(provider.accounts);
      setActiveAccount(provider.account);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(message);
      setConnected(false);
      console.error('Wallet connection error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setNimiq(null);
    setConnected(false);
    setAccounts([]);
    setActiveAccount(null);
    setError(null);
  }, []);

  useEffect(() => {
    // Auto-connect on component mount
    const autoConnect = async () => {
      try {
        const existingNimiq = getNimiq();
        if (!existingNimiq) {
          await connect();
        } else {
          setNimiq(existingNimiq);
          setConnected(true);
          setAccounts(existingNimiq.accounts);
          setActiveAccount(existingNimiq.account);
        }
      } catch (err) {
        console.log('Auto-connect failed, wallet may not be available');
      }
    };

    autoConnect();
  }, [connect]);

  return (
    <WalletContext.Provider
      value={{
        nimiq,
        connected,
        loading,
        error,
        connect,
        disconnect,
        accounts,
        activeAccount,
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
