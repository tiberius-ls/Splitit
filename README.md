# SplitIt — Nimiq Pay Mini App

Split expenses with friends and settle up in **real NIM**, right inside Nimiq Pay.

SplitIt is a [Nimiq Mini App](https://nimiq.dev/mini-apps): a web app that runs in the
Nimiq Pay WebView and talks to the wallet through the injected provider via
[`@nimiq/mini-app-sdk`](https://www.npmjs.com/package/@nimiq/mini-app-sdk). Keys never
leave the wallet — the app only *requests* actions, and Nimiq Pay shows a native
confirmation dialog before anything is signed or sent.

## Features

- **Connect** — requests account access through Nimiq Pay (native consent dialog).
- **New Split** — enter a bill, add participants, and settle your share by sending
  **real NIM** to whoever fronted the bill via `sendBasicTransaction`.
- **Request** — generate a scannable `nimiq:` payment-request QR for any amount.
- **Live network status** — real consensus state and block height from the host.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/lib/nimiqProvider.ts` | Resolves the injected provider (`init()`), NIM⇄Luna helpers, error guard |
| `src/lib/WalletContext.tsx` | React context: connect/disconnect, accounts, chain info |
| `src/lib/paymentService.ts` | Real `sendBasicTransaction` payments, address validation, payment URIs |
| `src/lib/splitService.ts` | Pure split math (shares, summaries) |
| `src/app/` | Home, New Split, and Request screens |

**Units:** the wallet API works in Lunas — `1 NIM = 100,000 Lunas`. Amounts entered in
NIM are converted with `nimToLunas()` before sending.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Outside Nimiq Pay there is no injected provider, so the
app detects this and prompts you to open it in Nimiq Pay — connecting and sending will
not work in a plain browser by design.

## Test inside Nimiq Pay

1. Deploy the app to a public HTTPS URL (e.g. Vercel).
2. Open it in Nimiq Pay via deeplink:
   ```
   nimiqpay://miniapp?url=https://your-app.example.com
   ```
3. Tap **Connect**, approve account access, then create a split and confirm the
   payment in the native dialog.

## Demo script (for judges)

> Run inside Nimiq Pay via `nimiqpay://miniapp?url=<deployed-url>`.

1. **Connect** — tap *Connect*, approve the native consent dialog. The home card
   switches to live **block height** and *Consensus established ✓* (real host data).
2. **Settle a split** — *New Split* → enter a small amount, a purpose, and a payee
   Nimiq address → *Review & Pay* → confirm in Nimiq Pay. A **real on-chain NIM
   transaction** is sent.
3. **History** — the settled split appears under *Recent Activity* with its real
   transaction (tap the chip to copy the full value).
4. **Request** — *Request* generates a scannable `nimiq:` payment-request QR for any
   amount, ready to share.

Guardrails worth pointing out: invalid addresses and paying your own address are
blocked before review; outside Nimiq Pay the app detects the missing provider and
prompts to open in the wallet rather than failing silently.

## Roadmap

- USDT settlement over EVM (`window.ethereum`) — UI present, marked *coming soon*.
- Per-participant settlement tracking and reminders.
