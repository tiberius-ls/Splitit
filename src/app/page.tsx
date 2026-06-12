import styles from "./page.module.css";
import { ArrowDownRight, Plus, Receipt, User, Wallet, AlertCircle } from "lucide-react";
import Link from "next/link";
import WalletStatus from "@/components/WalletStatus";

export default function Home() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>
          Split<span className="text-gradient">It</span>
        </div>
        <WalletStatus />
      </header>

      <section className={`${styles.balanceCard} glass-panel`}>
        <span className={styles.balanceLabel}>Total Balance</span>
        <div className={styles.balanceAmount}>
          <span className={styles.currency}>NIM</span> 1,240.50
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(248, 250, 252, 0.6)', marginTop: '8px' }}>
          Connected to Nimiq Pay ✓
        </span>
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
          {/* Example Item 1 */}
          <div className={`${styles.activityItem} glass-panel`}>
            <div className={styles.activityLeft}>
              <div className={styles.activityIcon}>
                <Receipt size={20} color="var(--primary)" />
              </div>
              <div className={styles.activityDetails}>
                <span className={styles.activityTitle}>Dinner at Mario's</span>
                <span className={styles.activityDate}>Today, 8:45 PM</span>
              </div>
            </div>
            <div className={styles.activityRight}>
              <span className={`${styles.activityAmount} ${styles.positive}`}>+ 45.00 NIM</span>
              <span className={`${styles.activityStatus} ${styles.statusSettled}`}>Settled</span>
            </div>
          </div>

          {/* Example Item 2 */}
          <div className={`${styles.activityItem} glass-panel`}>
            <div className={styles.activityLeft}>
              <div className={styles.activityIcon}>
                <Wallet size={20} color="var(--accent)" />
              </div>
              <div className={styles.activityDetails}>
                <span className={styles.activityTitle}>Uber to Airport</span>
                <span className={styles.activityDate}>Yesterday</span>
              </div>
            </div>
            <div className={styles.activityRight}>
              <span className={`${styles.activityAmount} ${styles.negative}`}>- 120.00 NIM</span>
              <span className={`${styles.activityStatus} ${styles.statusPending}`}>Pending</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
