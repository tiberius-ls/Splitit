"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { ArrowDownRight, Plus, Receipt } from "lucide-react";
import Link from "next/link";
import WalletStatus from "@/components/WalletStatus";
import { useWallet } from "@/lib/WalletContext";
import { getHistory, formatActivityDate, type SettledSplit } from "@/lib/historyService";
import { formatAddress } from "@/lib/paymentService";

export default function Home() {
  const { connected, inNimiqPay, chain, refreshChain } = useWallet();
  const [history, setHistory] = useState<SettledSplit[]>([]);

  useEffect(() => {
    if (connected) void refreshChain();
  }, [connected, refreshChain]);

  // localStorage is client-only, so read it after mount to avoid hydration mismatch.
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          Split<span className="text-gradient">It</span>
        </div>
        <WalletStatus />
      </header>

      <section className={`${styles.balanceCard} glass-panel`}>
        <span className={styles.balanceLabel}>Nimiq Network</span>
        {connected ? (
          <>
            <div className={styles.balanceAmount} style={{ fontSize: "2rem" }}>
              <span className={styles.currency}>BLOCK</span>
              {chain.blockNumber !== null ? `#${chain.blockNumber.toLocaleString()}` : "—"}
            </div>
            <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.6)", marginTop: "8px" }}>
              {chain.consensus === null
                ? "Checking consensus…"
                : chain.consensus
                ? "Consensus established ✓"
                : "Syncing…"}
            </span>
          </>
        ) : (
          <>
            <div className={styles.balanceAmount} style={{ fontSize: "20px" }}>
              {inNimiqPay ? "Wallet not connected" : "Open in Nimiq Pay"}
            </div>
            <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.6)", marginTop: "8px" }}>
              {inNimiqPay
                ? "Connect your wallet to get started"
                : "This mini-app runs inside Nimiq Pay"}
            </span>
          </>
        )}
      </section>

      <section className={styles.actionGrid}>
        <Link href="/new" className={`${styles.actionButton} ${styles.primary} glass-panel`}>
          <div className={styles.iconWrapper}>
            <Plus size={24} color="white" />
          </div>
          <span>New Split</span>
        </Link>
        <Link href="/request" className={`${styles.actionButton} glass-panel`}>
          <div className={styles.iconWrapper}>
            <ArrowDownRight size={24} color="white" />
          </div>
          <span>Request</span>
        </Link>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {history.length === 0 ? (
            <div className={`${styles.activityItem} glass-panel`} style={{ justifyContent: "center", padding: "28px 20px" }}>
              <div style={{ textAlign: "center", color: "rgba(248, 250, 252, 0.6)" }}>
                <Receipt size={28} color="var(--primary)" style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "14px" }}>No splits yet</p>
                <p style={{ fontSize: "12px", marginTop: "4px" }}>
                  Create a split or request to get started
                </p>
              </div>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className={`${styles.activityItem} glass-panel`}>
                <div className={styles.activityLeft}>
                  <div className={styles.activityIcon}>
                    <Receipt size={20} color="var(--primary)" />
                  </div>
                  <div className={styles.activityDetails}>
                    <span className={styles.activityTitle}>{item.title}</span>
                    <span className={styles.activityDate}>
                      {formatActivityDate(item.createdAt)} · to {formatAddress(item.recipient)}
                    </span>
                  </div>
                </div>
                <div className={styles.activityRight}>
                  <span className={`${styles.activityAmount} ${styles.negative}`}>
                    - {item.amount.toFixed(2)} {item.currency}
                  </span>
                  <span className={`${styles.activityStatus} ${styles.statusSettled}`}>Settled</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
