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

/** A valid 0x… EVM address. */
export const isValidEvmAddress = (address: string): boolean =>
  /^0x[0-9a-fA-F]{40}$/.test(address.trim());

/** Convert a decimal token amount string to base units (BigInt), honoring decimals. */
export const toTokenUnits = (amount: string, decimals: number): bigint => {
  const [whole, frac = ''] = amount.trim().split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(fracPadded || '0');
};

/** Build ERC-20 `transfer(address,uint256)` calldata. */
const encodeErc20Transfer = (to: string, units: bigint): string => {
  const selector = 'a9059cbb';
  const addr = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const amt = units.toString(16).padStart(64, '0');
  return '0x' + selector + addr + amt;
};

export interface EvmResult {
  success: boolean;
  txHash?: string;
  message: string;
  error?: string;
}

/** Prompt the host for EVM account access. Returns the active 0x address. */
export const requestEvmAccount = async (): Promise<string> => {
  const eth = getEthereum();
  if (!eth) throw new Error('No EVM provider — USDT needs Nimiq Pay with Ethereum support');
  const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
  if (!accounts?.length) throw new Error('No EVM account was authorized');
  return accounts[0];
};

/** Ensure the wallet is on Polygon, switching (or adding) the chain if needed. */
export const ensurePolygon = async (): Promise<void> => {
  const eth = getEthereum();
  if (!eth) throw new Error('No EVM provider');
  const current = (await eth.request({ method: 'eth_chainId' })) as string;
  if (current?.toLowerCase() === POLYGON_CHAIN_ID) return;
  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: POLYGON_CHAIN_ID }],
    });
  } catch (e) {
    // 4902 = chain not added to the wallet yet.
    const code = (e as { code?: number })?.code;
    if (code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: POLYGON_CHAIN_ID,
            chainName: 'Polygon',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
        ],
      });
    } else {
      throw e;
    }
  }
};

/**
 * Send USDT on Polygon via the host's window.ethereum. Switches to Polygon,
 * then submits an ERC-20 transfer. Returns the transaction hash.
 */
export const sendUsdtOnPolygon = async (to: string, amount: string): Promise<EvmResult> => {
  const cleanTo = to.trim();
  if (!isValidEvmAddress(cleanTo)) {
    return { success: false, error: 'Invalid address', message: 'Recipient is not a valid 0x… address' };
  }
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { success: false, error: 'Invalid amount', message: 'Amount must be a positive number' };
  }

  try {
    const eth = getEthereum();
    if (!eth) throw new Error('No EVM provider available');
    const from = await requestEvmAccount();
    await ensurePolygon();

    const units = toTokenUnits(amount, POLYGON_USDT.decimals);
    const data = encodeErc20Transfer(cleanTo, units);

    const txHash = (await eth.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: POLYGON_USDT.address, data, value: '0x0' }],
    })) as string;

    return { success: true, txHash, message: `Sent ${amountNum} USDT to ${cleanTo}` };
  } catch (e) {
    const code = (e as { code?: number })?.code;
    if (code === 4001) {
      return { success: false, error: 'rejected', message: 'You rejected the transaction' };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: msg, message: `USDT transfer failed: ${msg}` };
  }
};

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
