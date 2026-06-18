'use client';

/**
 * Savings Jar: a shared savings goal whose state lives entirely on-chain.
 * The jar config (title, target, currency, collector address) travels in the
 * shareable URL — no backend. Progress is read from the collector address's
 * live on-chain balance (see balance.ts).
 */
export interface Jar {
  title: string;
  /** Target amount in human units (NIM or USDT). */
  target: number;
  currency: 'NIM' | 'USDT';
  /** The collector address that receives contributions (NQ… for NIM, 0x… for USDT). */
  address: string;
}

/** Encode a jar into URL query params for sharing. */
export const encodeJar = (jar: Jar): string => {
  const params = new URLSearchParams({
    t: jar.title,
    g: String(jar.target),
    c: jar.currency,
    a: jar.address,
  });
  return params.toString();
};

/** Decode a jar from a query string (e.g. window.location.search). Returns null if incomplete. */
export const decodeJar = (search: string): Jar | null => {
  const params = new URLSearchParams(search);
  const title = params.get('t');
  const target = parseFloat(params.get('g') ?? '');
  const currency = params.get('c');
  const address = params.get('a');

  if (!title || !address || isNaN(target) || target <= 0) return null;
  if (currency !== 'NIM' && currency !== 'USDT') return null;

  return { title, target, currency, address };
};

/** Build a full shareable jar link from the current origin. */
export const jarLink = (jar: Jar): string => {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/jar?${encodeJar(jar)}`;
};

export const clampPercent = (raised: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, (raised / target) * 100));
};
