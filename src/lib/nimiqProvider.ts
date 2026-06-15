'use client';

import { init, getHostLanguage, type NimiqProvider } from '@nimiq/mini-app-sdk';

export type { NimiqProvider };

/** 1 NIM = 100,000 Lunas. The wallet API works in Lunas. */
export const LUNAS_PER_NIM = 1e5;

export const nimToLunas = (nim: number): number => Math.round(nim * LUNAS_PER_NIM);
export const lunasToNim = (lunas: number): number => lunas / LUNAS_PER_NIM;

/** Narrowing guard for the SDK's `{ error: { type, message } }` shape. */
export const isErrorResponse = (
  value: unknown,
): value is { error: { type: string; message: string } } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as { error: unknown }).error === 'object'
  );
};

let providerPromise: Promise<NimiqProvider> | null = null;

/**
 * Resolve the injected Nimiq provider. Outside Nimiq Pay this rejects after the
 * SDK's timeout ("provider was not injected"). The promise is cached so repeated
 * callers share a single handshake.
 */
export const getProvider = (timeout = 8000): Promise<NimiqProvider> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Nimiq provider is only available in the browser'));
  }
  if (!providerPromise) {
    providerPromise = init({ timeout }).catch((err) => {
      // Reset so a later retry (e.g. after the user opens the app in Nimiq Pay) can succeed.
      providerPromise = null;
      throw err;
    });
  }
  return providerPromise;
};

/** True when the page is running inside a Nimiq Pay WebView (provider injected). */
export const isInNimiqPay = (): boolean =>
  typeof window !== 'undefined' && typeof window.nimiq !== 'undefined';

/** User's language as selected in Nimiq Pay (ISO 639-1), or undefined outside it. */
export const hostLanguage = (): string | undefined => getHostLanguage();
