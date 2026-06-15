'use client';

const STORAGE_KEY = 'splitit:history';

export interface SettledSplit {
  id: string;
  title: string;
  /** Your share that was actually paid, in NIM. */
  amount: number;
  /** The full bill, in NIM. */
  total: number;
  currency: 'NIM';
  recipient: string;
  /** Serialized transaction returned by the wallet. */
  txHash: string;
  participants: number;
  createdAt: string;
}

/** Read the settled-split history (newest first). SSR-safe. */
export const getHistory = (): SettledSplit[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SettledSplit[]) : [];
  } catch {
    return [];
  }
};

/** Prepend a settled split and persist. Returns the updated list. */
export const addToHistory = (record: SettledSplit): SettledSplit[] => {
  if (typeof window === 'undefined') return [];
  const next = [record, ...getHistory()].slice(0, 50);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — non-fatal.
  }
  return next;
};

/** Remove all history. */
export const clearHistory = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

/** Short, human-friendly relative date for activity rows. */
export const formatActivityDate = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < 60 * 1000) return 'Just now';
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / (60 * 60 * 1000))}h ago`;
  if (diffMs < 2 * day) return 'Yesterday';
  return new Date(iso).toLocaleDateString();
};
