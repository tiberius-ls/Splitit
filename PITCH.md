# SplitIt — Pitch & Judge Demo

> Lead with the **jar**, not bill-splitting. The frame is **"group money"**: the easiest
> way for a group to spend *and save* together — settled in real crypto, inside the wallet
> they already have. Bill-splitting alone is a solved, unoriginal problem; the jar is the
> hook.

---

## 30-second hook (say this first)

> "Every group already shares money — the dinner bill, the trip fund, the group gift. Today
> that lives in a spreadsheet and a chase-everyone-on-WhatsApp loop, and it settles in fiat
> through a bank. **SplitIt makes group money native to Nimiq Pay.** Start a savings jar,
> share a link, and your friends chip in real NIM or USDT — and the progress bar isn't a
> number we store, it's the pot's **live on-chain balance**. No backend, no accounts, no
> trust in us. The blockchain *is* the shared state."

## 90-second live demo (the spine)

Run inside Nimiq Pay: `nimiqpay://miniapp?url=<deployed-url>`.

1. **Connect** (~10s) — tap *Connect*, approve the native dialog. Point at the home card:
   "That's **live consensus + block height from the wallet host** — this is really on-chain,
   not a mockup."
2. **Create a jar** (~20s) — *Savings Jar* → "Iceland trip", target, *Use my address*,
   *Create & Get Link*. "One link. No backend. Anyone who opens it can pay in."
3. **Friend chips in** (~25s) — open the link (second device / pre-opened), *Chip in* a
   small amount → confirm in the native dialog. Back on the jar, hit *Refresh*: "**The bar
   just moved because the chain balance moved.** That's the whole magic — shared state with
   zero infrastructure."
4. **Owner withdraws** (~20s) — as the owner, open *Withdraw*, sweep the pot to an address.
   "Goal hit → I pull the funds to actually spend them. Full loop: **create → fund →
   withdraw**, all real, all on-chain."
5. **Tie back to splitting** (~15s) — *New Split*: "And the same rails settle a bill —
   NIM, or **USDT on Polygon** when someone wants a stablecoin. Split *and* save: group
   money."

## Why it wins (judging criteria, mapped)

- **Originality / virality:** the jar is a *shareable link that pulls new people into Nimiq
  Pay* — built-in growth loop, not just a utility. Bill-splitting is the familiar on-ramp;
  the jar is the novel hook.
- **Real on-chain:** every number is live. Balances are read from public RPCs
  (Polygon `balanceOf`, Nimiq Albatross `getAccountByAddress`); every payment is a real
  `sendBasicTransaction` / ERC-20 transfer signed in the wallet. No mocked data anywhere.
- **Backendless:** jar config rides in the URL; progress is the chain balance. Nothing to
  host, nothing to breach, nothing to trust.
- **Dual-asset:** NIM for native speed, USDT-on-Polygon for stablecoin settlement — through
  the same `window.ethereum` the wallet injects.

## Judge Q&A — prepared answers

- **"What stops the collector from running off with the money?"**
  "Nothing in v1 — and that's deliberate. v1 is *group money among people who already trust
  each other*, like Splitwise, but settled on-chain instead of fiat. The withdraw button is
  owner-only and verified on-chain, so the app never touches funds it doesn't control. The
  **v2 roadmap is a trustless escrow contract** on Polygon that only releases on the goal —
  same UX, zero trust. We shipped the honest version first instead of faking custody."
- **"Isn't this just Splitwise / Venmo?"**
  "Those settle in fiat through banks and stop at splitting. We settle in crypto inside the
  wallet, and we *save* together, not just split. The shareable jar is a growth loop they
  don't have."
- **"Why both NIM and USDT?"**
  "NIM is fast and native to the wallet; USDT is what people actually hold a stable balance
  in. Supporting both means a group isn't blocked by what currency each member prefers."
- **"Does the live balance really work?"**
  "Yes — open the jar link on any device, even without connecting a wallet, and it reads the
  collector address's balance straight from a public RPC. Hit refresh after a contribution
  and watch it move."
- **"What if you're not in Nimiq Pay?"**
  "The app detects the missing provider and tells you to open it in the wallet, rather than
  failing silently. Connecting and paying are wallet-gated by design — keys never leave it."

## Pre-demo checklist (do NOT skip)

- [ ] App deployed to HTTPS; `NEXT_PUBLIC_NIM_RPC` correct for the network you're demoing
      (mainnet `rpc.nimiqwatch.com` is the default — **if you demo on testnet, point it at a
      testnet RPC or the NIM bar reads 0**).
- [ ] Demo wallet funded: a little **NIM**, plus **USDT + a little POL for gas** on Polygon.
- [ ] Jar collector address = the demo wallet's own address (so *Withdraw* shows for you).
- [ ] Second device (or browser) pre-opened on the jar link for the "friend chips in" beat.
- [ ] Amounts tiny — this is real money. Rehearse the native-dialog timing once.
- [ ] Fallback: if live signing is flaky on the network, have a short screen recording of
      the full loop as backup. Never debug live in front of judges.
