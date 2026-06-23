'use client';

import { POLYGON_USDT } from './evm';

/**
 * Read the live on-chain balance of a savings-jar collector address.
 * This is what makes a jar's progress bar real shared state — no backend.
 *
 * - USDT: queried from a public Polygon RPC via eth_call balanceOf (works for any
 *   viewer, even before they connect a wallet).
 * - NIM: queried from a public Nimiq Albatross RPC (nimiqwatch, free & rate-limited)
 *   by default; override with NEXT_PUBLIC_NIM_RPC. Falls back to null on failure so
 *   the UI degrades gracefully.
 */

const POLYGON_RPC = process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com';
const NIM_RPC = process.env.NEXT_PUBLIC_NIM_RPC || 'https://rpc.nimiqwatch.com';

/** USDT balance (human units) of an EVM address on Polygon, or null on failure. */
export const readUsdtBalance = async (address: string): Promise<number | null> => {
  try {
    const data = '0x70a08231' + address.toLowerCase().replace(/^0x/, '').padStart(64, '0');
    const res = await fetch(POLYGON_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: POLYGON_USDT.address, data }, 'latest'],
      }),
    });
    const json = await res.json();
    if (!json?.result || json.result === '0x') return 0;
    return Number(BigInt(json.result)) / 10 ** POLYGON_USDT.decimals;
  } catch {
    return null;
  }
};

/**
 * The Albatross RPC only accepts the user-friendly spaced address format
 * (NQxx xxxx … in groups of 4); a spaceless address errors with "Unknown format".
 * App code stores addresses with spacing stripped, so re-format before querying.
 */
const toSpacedAddress = (address: string): string => {
  const clean = address.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') ?? clean;
};

/** NIM balance (human units) of a Nimiq address, or null if no RPC / on failure. */
export const readNimBalance = async (address: string): Promise<number | null> => {
  if (!NIM_RPC) return null;
  try {
    const res = await fetch(NIM_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountByAddress',
        params: [toSpacedAddress(address)],
      }),
    });
    const json = await res.json();
    // Albatross RPC wraps results as { result: { data: {...} } }.
    const balanceLuna = json?.result?.data?.balance ?? json?.result?.balance;
    if (balanceLuna == null) return null;
    return Number(balanceLuna) / 1e5;
  } catch {
    return null;
  }
};

/** Read the jar balance for the right currency. Returns null when unavailable. */
export const readJarBalance = async (
  currency: 'NIM' | 'USDT',
  address: string,
): Promise<number | null> => {
  return currency === 'USDT' ? readUsdtBalance(address) : readNimBalance(address);
};
