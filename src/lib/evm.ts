'use client';

/**
 * Minimal EIP-1193 helpers for the EVM side of Nimiq Pay (USDT on Polygon).
 * The mini-app SDK is Nimiq-only, so anything EVM goes through window.ethereum
 * directly — IF Nimiq Pay injects it. detectEvm() is used to confirm that on-device
 * before we rely on it.
 */

export const POLYGON_CHAIN_ID = '0x89'; // 137
/** USDT (PoS) on Polygon — 6 decimals. */
export const POLYGON_USDT = {
  address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  decimals: 6,
  symbol: 'USDT',
};

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
}

export const getEthereum = (): Eip1193Provider | null => {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth ?? null;
};

export interface EvmInfo {
  available: boolean;
  chainId: string | null;
  accounts: string[];
  error?: string;
}

/** Non-intrusive probe: does window.ethereum exist, and what chain/accounts are visible? */
export const detectEvm = async (): Promise<EvmInfo> => {
  const eth = getEthereum();
  if (!eth) return { available: false, chainId: null, accounts: [] };
  try {
    const chainId = (await eth.request({ method: 'eth_chainId' }).catch(() => null)) as string | null;
    // eth_accounts does NOT prompt — returns only already-authorized accounts.
    const accounts = (await eth.request({ method: 'eth_accounts' }).catch(() => [])) as string[];
    return { available: true, chainId, accounts: accounts ?? [] };
  } catch (e) {
    return {
      available: true,
      chainId: null,
      accounts: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }
};

/** Human label for the chain ids we care about. */
export const chainName = (chainId: string | null): string => {
  switch (chainId?.toLowerCase()) {
    case '0x89':
      return 'Polygon';
    case '0x1':
      return 'Ethereum';
    case '0x2105':
      return 'Base';
    case '0xa4b1':
      return 'Arbitrum One';
    case '0xa':
      return 'Optimism';
    case '0x38':
      return 'BNB Smart Chain';
    case '0xaa36a7':
      return 'Sepolia';
    default:
      return chainId ?? 'unknown';
  }
};
