'use client';

import { useWallet } from '@/lib/WalletContext';
import { Wallet, LogOut } from 'lucide-react';
import styles from './WalletStatus.module.css';

export default function WalletStatus() {
  const { connected, activeAccount, connect, disconnect, loading } = useWallet();

  const displayAddress = activeAccount
    ? `${activeAccount.substring(0, 8)}...${activeAccount.substring(activeAccount.length - 6)}`
    : 'Connect Wallet';

  return (
    <div className={styles.walletStatus}>
      {connected ? (
        <div className={styles.connected}>
          <button
            className={styles.addressButton}
            title={activeAccount || ''}
            onClick={disconnect}
          >
            <Wallet size={16} />
            <span>{displayAddress}</span>
          </button>
          <button
            className={styles.disconnectBtn}
            onClick={disconnect}
            title="Disconnect wallet"
          >
            <LogOut size={16} />
          </button>
        </div>
      ) : (
        <button
          className={styles.connectBtn}
          onClick={connect}
          disabled={loading}
        >
          <Wallet size={16} />
          <span>{loading ? 'Connecting...' : 'Connect'}</span>
        </button>
      )}
    </div>
  );
}
