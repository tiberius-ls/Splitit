"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useWallet } from "@/lib/WalletContext";
import { detectEvm, chainName, getEthereum, POLYGON_CHAIN_ID, type EvmInfo } from "@/lib/evm";

/**
 * Unlinked diagnostics page (visit /diag manually inside Nimiq Pay).
 * Confirms what the host injects so we can decide if a real USDT/Polygon
 * flow is feasible. Not linked from the app UI.
 */
export default function Diag() {
  const { inNimiqPay } = useWallet();
  const [evm, setEvm] = useState<EvmInfo | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    void detectEvm().then(setEvm);
  }, []);

  const append = (line: string) => setLog((l) => [...l, line]);

  const requestEvmAccounts = async () => {
    const eth = getEthereum();
    if (!eth) return append("window.ethereum is not present — cannot request accounts");
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      append(`eth_requestAccounts → ${JSON.stringify(accounts)}`);
      const chainId = (await eth.request({ method: "eth_chainId" })) as string;
      append(`eth_chainId → ${chainId} (${chainName(chainId)})`);
    } catch (e) {
      append(`error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const trySwitchPolygon = async () => {
    const eth = getEthereum();
    if (!eth) return append("window.ethereum is not present");
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
      append(`switched to Polygon (${POLYGON_CHAIN_ID}) ✓`);
    } catch (e) {
      append(`switch error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const box: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: "12px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: "8px",
    padding: "12px",
    wordBreak: "break-all",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <main style={{ padding: "2rem 1.5rem", maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Link href="/" style={{ display: "flex" }}><ArrowLeft size={24} color="white" /></Link>
        <h1 style={{ fontSize: "1.1rem" }}>Diagnostics</h1>
      </header>

      <div style={box}>
        <strong>Host</strong>
        <div>inNimiqPay: {String(inNimiqPay)}</div>
        <div>window.ethereum: {evm === null ? "probing…" : evm.available ? "present ✓" : "NOT present"}</div>
        <div>chainId: {evm?.chainId ?? "—"} ({chainName(evm?.chainId ?? null)})</div>
        <div>visible accounts: {evm ? evm.accounts.length : "—"}</div>
        {evm?.error ? <div style={{ color: "#ef4444" }}>error: {evm.error}</div> : null}
      </div>

      <button className="glass-button" onClick={requestEvmAccounts}>Request EVM accounts</button>
      <button className="glass-button" onClick={trySwitchPolygon} style={{ background: "rgba(82,113,255,0.3)" }}>
        Try switch to Polygon
      </button>

      {log.length > 0 && (
        <div style={box}>
          <strong>Log</strong>
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </main>
  );
}
