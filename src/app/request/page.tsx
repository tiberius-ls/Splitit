"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";
import { ArrowLeft, Share2, Copy, AlertCircle } from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import { useWallet } from "@/lib/WalletContext";

export default function RequestNIM() {
  const { connected, activeAccount, connect, loading, error } = useWallet();
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  // Use real address from wallet, or show placeholder if not connected
  const myAddress = activeAccount || "Connect wallet to generate QR code";
  
  // Format for Nimiq Payment Request
  // Example: nimiq:NQXX...XX?amount=123.45&message=Dinner
  const qrData = activeAccount 
    ? `nimiq:${myAddress.replace(/\s/g, '')}?amount=${amount}${purpose ? `&message=${encodeURIComponent(purpose)}` : ''}`
    : '';

  const handleCopyLink = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </Link>
        <div className={styles.title}>Request NIM</div>
        <div className={styles.placeholder} />
      </header>

      {error && (
        <div style={{ padding: '16px', marginBottom: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!connected ? (
        <section className={`${styles.formCard} glass-panel`} style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <AlertCircle size={48} color="var(--accent)" style={{ margin: '0 auto' }} />
          </div>
          <h2 style={{ marginBottom: '12px', fontSize: '18px' }}>Connect Your Wallet</h2>
          <p style={{ marginBottom: '24px', color: 'rgba(248, 250, 252, 0.7)', fontSize: '14px' }}>
            Connect your Nimiq wallet to generate payment request QR codes and receive funds.
          </p>
          <button 
            className={`glass-button ${styles.submitButton}`}
            onClick={connect}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect Nimiq Wallet'}
          </button>
        </section>
      ) : !showQR ? (
        <>
          <section className={`${styles.formCard} glass-panel`}>
            <div className={styles.inputGroup}>
              <label>Amount (NIM)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="glass-input" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus 
              />
            </div>

            <div className={styles.inputGroup}>
              <label>What's it for?</label>
              <input 
                type="text" 
                placeholder="e.g. Movie tickets" 
                className="glass-input" 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className={styles.inputGroup} style={{ fontSize: '12px', color: 'rgba(248, 250, 252, 0.6)' }}>
              <label>Your Address</label>
              <div style={{ padding: '8px 12px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '6px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {myAddress}
              </div>
            </div>
          </section>

          <button 
            className={`glass-button ${styles.submitButton}`}
            onClick={() => setShowQR(true)}
            disabled={!amount || isNaN(parseFloat(amount))}
            style={{ opacity: (!amount || isNaN(parseFloat(amount))) ? 0.5 : 1 }}
          >
            Generate QR Code
          </button>
        </>
      ) : (
        <section className={`${styles.qrCard} glass-panel`}>
          <h3>Scan to Pay</h3>
          <p className={styles.amountText}>{amount} NIM</p>
          {purpose && <p className={styles.purposeText}>{purpose}</p>}
          
          <div className={styles.qrWrapper}>
            {qrData ? <QRCode value={qrData} size={200} /> : null}
          </div>
          
          <div className={styles.addressBox}>
            <span className={styles.addressLabel}>My Address:</span>
            <span className={styles.addressValue}>{myAddress}</span>
          </div>

          <div className={styles.actionRow}>
            <button className={`glass-button ${styles.actionBtn}`} onClick={handleCopyLink}>
              <Copy size={18} /> {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button className={`glass-button ${styles.actionBtn}`} onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Request for NIM',
                  text: `Please pay me ${amount} NIM for ${purpose}.`,
                  url: qrData
                });
              }
            }}>
              <Share2 size={18} /> Share
            </button>
          </div>
          
          <button className={styles.resetBtn} onClick={() => setShowQR(false)}>
            Create New Request
          </button>
        </section>
      )}
    </main>
  );
}
