"use client";

import { useState } from "react";
import styles from "./page.module.css";
import { ArrowLeft, Check, Users, X, Share2, Copy, CheckCircle, Zap } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/lib/WalletContext";
import { createSplit, formatSplitSummary } from "@/lib/splitService";
import { sendPayment, isValidAddress, formatAddress } from "@/lib/paymentService";
import { addToHistory } from "@/lib/historyService";

interface Participant {
  name: string;
}

type Step = "form" | "review" | "success" | "error";

export default function NewSplit() {
  const { connected, activeAccount, provider, connect, loading: walletLoading } = useWallet();
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  // USDT settlement is not implemented yet — NIM only for now.
  const currency = "NIM" as const;
  const [participants, setParticipants] = useState<Participant[]>([{ name: "You" }]);
  const [isAdding, setIsAdding] = useState(false);
  const [newParticipant, setNewParticipant] = useState("");
  const [error, setError] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAddParticipant = () => {
    if (newParticipant.trim() !== "" && participants.length < 10) {
      setParticipants([...participants, { name: newParticipant.trim() }]);
      setNewParticipant("");
      setIsAdding(false);
    }
  };

  const handleRemoveParticipant = (index: number) => {
    if (index === 0) return;
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const isValid =
    amount !== "" &&
    !isNaN(parseFloat(amount)) &&
    parseFloat(amount) > 0 &&
    purpose.trim() !== "" &&
    isValidAddress(recipient);

  const splitAmount = isValid
    ? (parseFloat(amount) / participants.length).toFixed(2)
    : "0.00";

  const handleSubmit = () => {
    if (!isValid) return;
    if (!connected || !activeAccount) {
      setError("Please connect your wallet first");
      setStep("error");
      return;
    }
    setStep("review");
  };

  const handleConfirmSplit = async () => {
    if (!connected || !activeAccount || !provider) {
      setError("Wallet connection lost");
      setStep("error");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // Record the split locally for the summary/share UI.
      const split = createSplit(
        purpose,
        parseFloat(amount),
        currency,
        participants,
        activeAccount
      );

      // The connected user settles their own share on-chain to the payee.
      const result = await sendPayment(provider, {
        recipient,
        amount: splitAmount,
        message: `SplitIt: ${purpose}`,
      });

      if (!result.success) {
        setError(result.message);
        setStep("error");
        return;
      }

      const txHash = result.tx ?? "";
      setTransactionHash(txHash);

      // Persist to local history so it shows up under Recent Activity.
      addToHistory({
        id: split.id,
        title: purpose,
        amount: parseFloat(splitAmount),
        total: parseFloat(amount),
        currency,
        recipient,
        txHash,
        participants: participants.length,
        createdAt: split.createdAt,
      });

      console.log("✅ Split settled:", split, formatSplitSummary(split));
      setStep("success");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to settle split";
      setError(errorMsg);
      setStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep("form");
    setAmount("");
    setPurpose("");
    setRecipient("");
    setParticipants([{ name: "You" }]);
    setError("");
    setTransactionHash("");
  };

  if (step === "error") {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={handleReset}>
            <ArrowLeft size={24} color="white" />
          </button>
          <div className={styles.title}>Error</div>
          <div className={styles.placeholder} />
        </header>

        <section className={`${styles.formCard} glass-panel`} style={{ textAlign: "center", padding: "32px 20px" }}>
          <div style={{ marginBottom: "16px", color: "var(--danger)" }}>
            <X size={48} style={{ margin: "0 auto" }} />
          </div>
          <h2 style={{ marginBottom: "12px" }}>{error}</h2>
          <button className={`glass-button ${styles.submitButton}`} onClick={handleReset}>
            Try Again
          </button>
        </section>
      </main>
    );
  }

  if (step === "review") {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={() => setStep("form")}>
            <ArrowLeft size={24} color="white" />
          </button>
          <div className={styles.title}>Review Split</div>
          <div className={styles.placeholder} />
        </header>

        <section className={`${styles.formCard} glass-panel`}>
          <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>{purpose}</h3>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--primary)" }}>
              {amount} {currency}
            </div>
          </div>

          <div className={styles.splitSummary}>
            {participants.map((p, i) => (
              <div key={i} className={styles.summaryRow}>
                <div className={styles.summaryLeft}>
                  <div className={styles.participantAvatar}>
                    {p.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span>{p.name}</span>
                </div>
                <span className={styles.summaryAmount}>
                  {splitAmount} {currency}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px", padding: "12px", background: "rgba(34, 211, 238, 0.1)", borderRadius: "6px", fontSize: "12px", color: "rgba(248, 250, 252, 0.8)" }}>
            💡 You&apos;ll pay your share of <strong>{splitAmount} {currency}</strong> to {formatAddress(recipient)}. Nimiq Pay will ask you to confirm.
          </div>
        </section>

        <button
          className={`glass-button ${styles.submitButton}`}
          onClick={handleConfirmSplit}
          disabled={isProcessing}
          style={{ opacity: isProcessing ? 0.6 : 1, marginTop: "16px" }}
        >
          {isProcessing ? "Confirm in Nimiq Pay…" : `Pay ${splitAmount} ${currency}`}
        </button>
        <button
          className={`glass-button ${styles.submitButton}`}
          onClick={() => setStep("form")}
          style={{ background: "rgba(82, 113, 255, 0.2)", marginTop: "8px" }}
        >
          Back to Edit
        </button>
      </main>
    );
  }

  if (step === "success") {
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <button className={styles.backButton} onClick={handleReset}>
            <ArrowLeft size={24} color="white" />
          </button>
          <div className={styles.title}>Payment Sent!</div>
          <div className={styles.placeholder} />
        </header>

        <section className={`${styles.successCard} glass-panel`}>
          <div className={styles.successIcon}>
            <CheckCircle size={56} color="var(--success)" />
          </div>

          <h2 className={styles.successTitle}>{purpose}</h2>
          <p className={styles.successTotal}>
            <span className={styles.currency}>{currency}</span> {parseFloat(splitAmount).toFixed(2)}
          </p>

          <div className={styles.splitSummary}>
            {participants.map((p, i) => (
              <div key={i} className={styles.summaryRow}>
                <div className={styles.summaryLeft}>
                  <div className={styles.participantAvatar}>
                    {p.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span>{p.name}</span>
                </div>
                <span className={styles.summaryAmount}>{splitAmount} {currency}</span>
              </div>
            ))}
          </div>

          {transactionHash && (
            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "6px", fontSize: "11px", color: "var(--success)", fontFamily: "monospace", wordBreak: "break-all", overflowWrap: "anywhere", width: "100%", maxWidth: "100%", boxSizing: "border-box", textAlign: "left" }}>
              <strong>Transaction:</strong> {transactionHash}
            </div>
          )}

          <div className={styles.actionRow}>
            <button
              className={`glass-button ${styles.actionBtn}`}
              onClick={() => {
                const summary = formatSplitSummary({
                  id: "split_demo",
                  title: purpose,
                  totalAmount: parseFloat(amount),
                  currency,
                  participants,
                  initiator: activeAccount || "unknown",
                  createdAt: new Date().toISOString(),
                  status: "pending"
                });
                navigator.clipboard.writeText(summary);
              }}
            >
              <Copy size={18} /> Copy Summary
            </button>
            <button
              className={`glass-button ${styles.actionBtn}`}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Split: ${purpose}`,
                    text: `Split expense: Each person owes ${splitAmount} ${currency} for ${purpose}`,
                  });
                }
              }}
            >
              <Share2 size={18} /> Share
            </button>
          </div>
        </section>

        <Link href="/" className={`glass-button ${styles.homeBtn}`}>
          Back to Home
        </Link>
      </main>
    );
  }

  // Form step
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </Link>
        <div className={styles.title}>New Split</div>
        <div className={styles.placeholder} />
      </header>

      {!connected && (
        <div style={{ padding: "12px", marginBottom: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "12px" }}>
          ⚠️ Connect your wallet to settle splits with real NIM payments
        </div>
      )}

      <section className={`${styles.formCard} glass-panel`}>
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
          <div className={styles.inputGroup} style={{ flex: 1 }}>
            <label>Total Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className="glass-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              disabled={!connected}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <label style={{ fontSize: "12px", marginBottom: "8px" }}>Currency</label>
            <select
              value={currency}
              className="glass-input"
              style={{ width: "110px", padding: "8px" }}
              disabled
              title="USDT settlement is coming soon"
            >
              <option value="NIM">NIM</option>
              <option value="USDT" disabled>USDT (soon)</option>
            </select>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label>What&apos;s it for?</label>
          <input
            type="text"
            placeholder="e.g. Dinner at Mario's"
            className="glass-input"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            disabled={!connected}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Pay to (Nimiq address)</label>
          <input
            type="text"
            placeholder="NQ.. address of whoever fronted the bill"
            className="glass-input"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={!connected}
            style={{ fontFamily: "monospace", fontSize: "13px" }}
          />
          {recipient !== "" && !isValidAddress(recipient) && (
            <span style={{ fontSize: "11px", color: "var(--danger)" }}>Not a valid Nimiq address</span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.labelWithAction}>
            <span>Participants ({participants.length})</span>
            {!isAdding && (
              <button
                className={styles.addBtn}
                onClick={() => setIsAdding(true)}
                disabled={!connected || participants.length >= 10}
              >
                <Users size={16} /> Add
              </button>
            )}
          </label>

          <div className={styles.participantsList}>
            {participants.map((p, i) => (
              <div key={i} className={styles.participant}>
                <div className={styles.participantLeft}>
                  <div className={styles.participantAvatar}>
                    {p.name.substring(0, 1).toUpperCase()}
                  </div>
                  <span>{p.name}</span>
                </div>
                <div className={styles.participantRight}>
                  <span className={styles.splitAmount}>{splitAmount} {currency}</span>
                  {i !== 0 && (
                    <button className={styles.removeBtn} onClick={() => handleRemoveParticipant(i)}>
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isAdding && (
              <div className={styles.addParticipantRow}>
                <input
                  type="text"
                  placeholder="Name"
                  className={`glass-input ${styles.addInput}`}
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddParticipant()}
                  autoFocus
                />
                <button className={styles.confirmAddBtn} onClick={handleAddParticipant}>
                  <Check size={16} />
                </button>
                <button
                  className={styles.cancelAddBtn}
                  onClick={() => {
                    setIsAdding(false);
                    setNewParticipant("");
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <button
        className={`glass-button ${styles.submitButton}`}
        onClick={connected ? handleSubmit : connect}
        disabled={connected ? !isValid : walletLoading}
        style={{ opacity: connected && !isValid ? 0.5 : 1 }}
      >
        <Zap size={18} style={{ marginRight: "8px" }} />
        {walletLoading ? "Connecting…" : !connected ? "Connect Wallet" : "Review & Pay"}
      </button>
    </main>
  );
}
