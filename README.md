# SplitIt — Nimiq Pay Mini App

Split expenses with friends and settle up in **real NIM or USDT**, right inside Nimiq Pay.

SplitIt is a [Nimiq Mini App](https://nimiq.dev/mini-apps): a web app that runs in the
Nimiq Pay WebView and talks to the wallet through the injected providers — Nimiq via
[`@nimiq/mini-app-sdk`](https://www.npmjs.com/package/@nimiq/mini-app-sdk) and EVM via
`window.ethereum`. Keys never leave the wallet — the app only *requests* actions, and
Nimiq Pay shows a native confirmation dialog before anything is signed or sent.

## Features

- **Connect** — requests account access through Nimiq Pay (native consent dialog).
- **New Split** — enter a bill, add participants, and settle your share by sending
  **real NIM** (`sendBasicTransaction`) **or USDT on Polygon** (ERC-20 transfer over
  `window.ethereum`) to whoever fronted the bill.
- **Savings Jar** — create a shared savings goal with a collector address, share a
  link, and friends chip in real NIM/USDT. The progress bar tracks the pot's **live
  on-chain balance** — no backend, the blockchain is the shared state. The jar owner
  can **withdraw** the collected funds to any address once the goal is reached, and
  any saved jar can be **removed** from your list.
- **Request** — generate a scannable `nimiq:` payment-request QR for any amount.
- **Live network status** — real consensus state and block height from the host.
- **History** — settled splits persist locally with their real transaction hashes.

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/lib/nimiqProvider.ts` | Resolves the injected provider (`init()`), NIM⇄Luna helpers, error guard |
| `src/lib/WalletContext.tsx` | React context: connect/disconnect, accounts, chain info |
| `src/lib/paymentService.ts` | Real NIM `sendBasicTransaction` payments, address validation, payment URIs |
| `src/lib/evm.ts` | USDT-on-Polygon: chain switch + ERC-20 `transfer()` via `window.ethereum` |
| `src/lib/splitService.ts` | Pure split math (shares, summaries) |
| `src/lib/historyService.ts` | Local persistence of settled splits |
| `src/lib/jarService.ts` | Savings Jar: encode/decode jar config in a shareable URL |
| `src/lib/balance.ts` | Read a jar's live on-chain balance (Polygon USDT `balanceOf`; Nimiq RPC) |
| `src/app/` | Home, New Split, Request, and Savings Jar screens |

**Units:** the Nimiq wallet API works in Lunas — `1 NIM = 100,000 Lunas` (`nimToLunas()`).
USDT on Polygon uses 6 decimals; amounts are converted to base units with `toTokenUnits()`
before building the ERC-20 transfer. USDT settlement requires a small amount of POL for gas.

**Jar balances:** both currencies read live balance out of the box — USDT from a public
Polygon RPC (`balanceOf`), NIM from a public Nimiq Albatross RPC (`getAccountByAddress`,
defaulting to `rpc.nimiqwatch.com`). Override either with `NEXT_PUBLIC_POLYGON_RPC` /
`NEXT_PUBLIC_NIM_RPC` (e.g. a self-hosted node, or a testnet RPC if demoing on testnet).
The Albatross RPC only accepts the spaced address format, so addresses are re-formatted
before querying.

**Withdrawal model:** a jar is *not* an escrow contract — contributions collect at the
plain collector address, so whoever owns that address's key controls the funds. The
in-app **Withdraw** panel therefore appears only to the connected wallet that owns the
collector address (verified on-chain at send time for USDT); everyone else just sees
progress + *Chip in*. This keeps v1 fully backendless and honest; a trustless escrow
contract is the v2 step (see Roadmap).

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
2. **Settle in NIM** — *New Split* → currency *NIM*, enter a small amount, a purpose,
   and a payee `NQ…` address → *Review & Pay* → confirm. A **real on-chain NIM
   transaction** is sent.
3. **Settle in USDT** — switch currency to *USDT*, enter a `0x…` payee → *Review & Pay*.
   The app switches the wallet to **Polygon** and submits a **real ERC-20 USDT transfer**.
4. **Savings Jar** — *Savings Jar* → set a goal + collector address → get a shareable
   link. Open the link: the progress bar reflects the pot's **live on-chain balance**,
   and *Chip in* sends a real contribution. Share the link to pull friends into Nimiq Pay.
   As the jar **owner**, a *Withdraw* panel lets you sweep the collected funds to any
   address (a real on-chain send) — the full create → fund → withdraw loop, no backend.
5. **History** — settled splits appear under *Recent Activity* with their real
   transaction hashes (tap the chip to copy the full value).
6. **Request** — *Request* generates a scannable `nimiq:` payment-request QR.

Guardrails worth pointing out: addresses are validated per currency (`NQ…` vs `0x…`),
paying your own address is blocked before review, and outside Nimiq Pay the app detects
the missing provider and prompts to open in the wallet rather than failing silently.

## Roadmap

- **Trustless jar escrow** — replace the plain collector address with a smart-contract
  escrow (USDT on Polygon) that only releases on goal/owner approval, so contributors
  don't have to trust the collector. v1 is deliberately backendless and trust-based
  (group money among people who already know each other); this is the trustless step.
- Per-participant settlement tracking and reminders.
- Additional EVM stablecoins/chains beyond USDT-on-Polygon.
