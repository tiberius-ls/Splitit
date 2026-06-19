"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PiggyBank, Share2, Copy, Check, Zap } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { sendPayment, isValidAddress, formatAddress } from "@/lib/paymentService";
import { sendUsdtOnPolygon, isValidEvmAddress } from "@/lib/evm";
import { decodeJar, jarLink, clampPercent, type Jar } from "@/lib/jarService";
import { readJarBalance } from "@/lib/balance";

export default function JarPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <JarRouter />
    </Suspense>
  );
}

function JarRouter() {
  const { connected, activeAccount, provider, connect, loading: walletLoading } = useWallet();
  const search = useSearchParams();
  // Reactive: re-derives whenever the query string changes (e.g. create → view).
  const jar = decodeJar(search.toString());

  return jar ? (
    <ViewJar jar={jar} connected={connected} activeAccount={activeAccount} provider={provider} connect={connect} walletLoading={walletLoading} />
  ) : (
    <CreateJar connected={connected} activeAccount={activeAccount} connect={connect} walletLoading={walletLoading} />
  );
}

/* ---------- Create ---------- */

function CreateJar({
  connected,
  activeAccount,
  connect,
  walletLoading,
}: {
  connected: boolean;
  activeAccount: string | null;
  connect: () => void;
  walletLoading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState<"NIM" | "USDT">("NIM");
  const [address, setAddress] = useState("");
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const addrValid = currency === "NIM" ? isValidAddress(address) : isValidEvmAddress(address);
  const valid =
    title.trim() !== "" && parseFloat(target) > 0 && addrValid;

  const create = () => {
    if (!valid) return;
    setLink(jarLink({ title: title.trim(), target: parseFloat(target), currency, address: address.trim() }));
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (link) {
    return (
      <Shell title="Jar Created!">
        <section className="glass-panel" style={card}>
          <div style={{ textAlign: "center" }}>
            <PiggyBank size={48} color="var(--nimiq-gold)" />
            <h2 style={{ margin: "12px 0 4px" }}>{title}</h2>
            <p style={{ color: "rgba(248,250,252,0.6)", fontSize: 14 }}>
              Goal: {parseFloat(target)} {currency}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "rgba(248,250,252,0.7)", textAlign: "center" }}>
            Share this link — anyone who opens it can chip in, and the progress bar tracks the pot&apos;s real on-chain balance.
          </p>
          <div style={{ ...mono, background: "rgba(0,0,0,0.3)" }}>{link}</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="glass-button" style={{ flex: 1 }} onClick={copy}>
              {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              className="glass-button"
              style={{ flex: 1, background: "rgba(82,113,255,0.25)" }}
              onClick={() => {
                if (navigator.share) navigator.share({ title: `Savings Jar: ${title}`, url: link });
              }}
            >
              <Share2 size={18} /> Share
            </button>
          </div>
        </section>
        <Link href={link.replace(window.location.origin, "")} className="glass-button" style={{ ...btn, textAlign: "center" }}>
          Open the jar
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title="New Savings Jar">
      {!connected && (
        <div style={warn}>⚠️ Connect your wallet to create a jar</div>
      )}
      <section className="glass-panel" style={card}>
        <Field label="What are you saving for?">
          <input className="glass-input" placeholder="e.g. Beach trip" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!connected} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Target" flex>
            <input className="glass-input" type="number" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} disabled={!connected} />
          </Field>
          <Field label="Currency">
            <select
              aria-label="Currency"
              className="glass-input"
              style={{ width: 110, padding: 8 }}
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as "NIM" | "USDT");
                setAddress("");
              }}
              disabled={!connected}
            >
              <option value="NIM">NIM</option>
              <option value="USDT">USDT</option>
            </select>
          </Field>
        </div>
        <Field label={`Collector address (${currency === "NIM" ? "NQ…" : "0x… on Polygon"})`}>
          <input
            className="glass-input"
            style={{ fontFamily: "monospace", fontSize: 13 }}
            placeholder={currency === "NIM" ? "NQ.. where funds collect" : "0x.. where funds collect"}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!connected}
          />
          {currency === "NIM" && activeAccount && (
            <button onClick={() => setAddress(activeAccount)} style={linkBtn}>Use my address</button>
          )}
          {address !== "" && !addrValid && <span style={errText}>Not a valid {currency === "NIM" ? "Nimiq" : "0x"} address</span>}
        </Field>
      </section>
      <button
        className="glass-button"
        style={{ ...btn, opacity: connected && !valid ? 0.5 : 1 }}
        onClick={connected ? create : connect}
        disabled={connected ? !valid : walletLoading}
      >
        <PiggyBank size={18} /> {walletLoading ? "Connecting…" : !connected ? "Connect Wallet" : "Create & Get Link"}
      </button>
    </Shell>
  );
}

/* ---------- View / Contribute ---------- */

function ViewJar({
  jar,
  connected,
  activeAccount,
  provider,
  connect,
  walletLoading,
}: {
  jar: Jar;
  connected: boolean;
  activeAccount: string | null;
  provider: ReturnType<typeof useWallet>["provider"];
  connect: () => void;
  walletLoading: boolean;
}) {
  const [raised, setRaised] = useState<number | null>(null);
  const [loadingBal, setLoadingBal] = useState(true);
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    setLoadingBal(true);
    const bal = await readJarBalance(jar.currency, jar.address);
    setRaised(bal);
    setLoadingBal(false);
  }, [jar.currency, jar.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const contribute = async () => {
    if (!connected || parseFloat(amount) <= 0) return;
    setSending(true);
    setStatus(null);
    try {
      let ok: boolean;
      let msg: string;
      if (jar.currency === "NIM") {
        if (!provider) throw new Error("Nimiq wallet not connected");
        const r = await sendPayment(provider, { recipient: jar.address, amount, message: `Jar: ${jar.title}` });
        ok = r.success;
        msg = r.message;
      } else {
        const r = await sendUsdtOnPolygon(jar.address, amount);
        ok = r.success;
        msg = r.message;
      }
      setStatus({ ok, msg });
      if (ok) {
        setAmount("");
        // Give the chain a moment, then refresh the pot balance.
        setTimeout(() => void refresh(), 2500);
      }
    } catch (e) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  };

  const pct = raised !== null ? clampPercent(raised, jar.target) : 0;

  return (
    <Shell title="Savings Jar">
      <section className="glass-panel" style={card}>
        <div style={{ textAlign: "center" }}>
          <PiggyBank size={44} color="var(--nimiq-gold)" />
          <h2 style={{ margin: "10px 0 2px" }}>{jar.title}</h2>
          <p style={{ color: "rgba(248,250,252,0.6)", fontSize: 13 }}>to {formatAddress(jar.address)}</p>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "var(--nimiq-gold)" }}>
              {loadingBal ? "…" : raised !== null ? `${raised.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"} {jar.currency}
            </span>
            <span style={{ color: "rgba(248,250,252,0.6)" }}>of {jar.target.toLocaleString()} {jar.currency}</span>
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--nimiq-gold), #f59e0b)", transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "rgba(248,250,252,0.5)" }}>
            <span>{Math.round(pct)}% funded</span>
            <button onClick={() => void refresh()} style={linkBtn}>Refresh</button>
          </div>
          {raised === null && !loadingBal && (
            <p style={{ fontSize: 11, color: "rgba(248,250,252,0.45)", marginTop: 8 }}>
              Live balance unavailable for this currency right now — contributions still go through on-chain.
            </p>
          )}
        </div>
      </section>

      {/* Contribute */}
      <section className="glass-panel" style={card}>
        <Field label={`Contribute (${jar.currency})`}>
          <input className="glass-input" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={!connected} autoFocus />
        </Field>
        {status && (
          <div style={{ ...statusBox, background: status.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: status.ok ? "var(--success)" : "var(--danger)" }}>
            {status.msg}
          </div>
        )}
        <button
          className="glass-button"
          style={{ ...btn, opacity: connected && parseFloat(amount) > 0 ? 1 : 0.5 }}
          onClick={connected ? contribute : connect}
          disabled={connected ? sending || !(parseFloat(amount) > 0) : walletLoading}
        >
          <Zap size={18} /> {walletLoading ? "Connecting…" : sending ? "Confirm in wallet…" : !connected ? "Connect Wallet" : `Chip in ${amount || ""} ${jar.currency}`}
        </button>
      </section>

      <Link href="/jar" className="glass-button" style={{ ...btn, background: "rgba(82,113,255,0.2)", textAlign: "center" }}>
        Start your own jar
      </Link>
    </Shell>
  );
}

/* ---------- Shared bits ---------- */

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main style={{ padding: "2rem 1.5rem", maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex" }}><ArrowLeft size={24} color="white" /></Link>
        <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{title}</div>
        <div style={{ width: 24 }} />
      </header>
      {children}
    </main>
  );
}

function Field({ label, children, flex }: { label: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: flex ? 1 : undefined }}>
      <label style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}

const card: React.CSSProperties = { padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" };
const btn: React.CSSProperties = { width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "1.1rem" };
const mono: React.CSSProperties = { fontFamily: "monospace", fontSize: 12, padding: 12, borderRadius: 8, wordBreak: "break-all", width: "100%", boxSizing: "border-box" };
const warn: React.CSSProperties = { padding: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 12 };
const errText: React.CSSProperties = { fontSize: 11, color: "var(--danger)" };
const linkBtn: React.CSSProperties = { background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0, textAlign: "left" };
const statusBox: React.CSSProperties = { padding: 12, borderRadius: 8, fontSize: 13, wordBreak: "break-all" };
