"use client";

import Link from "next/link";
import styles from "./MobileCategoryGrid.module.css";

export default function MobileCategoryGrid() {
  return (
    <section className={styles.categoryGridSection}>
      <div className={styles.gridContainer}>
        {/* Large Left Card */}
        <Link href="/properties" className={`${styles.gridCard} ${styles.cardLarge}`}>
          <div className={styles.cardBg} style={{ backgroundImage: "url('/category_new_developments.png')" }} />
          <div className={styles.cardOverlay} />
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>New<br/>Developments</h3>
            <p className={styles.cardSubtitle}>Register for alerts</p>
          </div>
        </Link>
        
        {/* Right Column Stack */}
        <div className={styles.rightStack}>
          {/* Top Right Card */}
          <Link href="/properties" className={`${styles.gridCard} ${styles.cardTopRight}`}>
            <div className={styles.cardBg} style={{ backgroundImage: "url('/category_designer_homes_schedule.png')" }} />
            <div className={styles.cardOverlayLight} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitleGold}>Designer<br/>Homes</h3>
            </div>
          </Link>
          
          {/* Bottom Right Card */}
          <Link href="/properties" className={`${styles.gridCard} ${styles.cardBottomRight}`}>
            <div className={styles.cardBg} style={{ backgroundImage: "url('/category_designer_homes.png')" }} />
            <div className={styles.cardOverlayLight} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Designer<br/>Homes</h3>
            </div>
          </Link>
        </div>

        {/* Full Width Bottom Card */}
        <Link href="/properties" className={`${styles.gridCard} ${styles.cardFullWidth}`}>
          <div className={styles.cardBg} style={{ backgroundImage: "url('/category_investment_props.png')" }} />
          <div className={styles.cardOverlayBlue} />
          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>Investment<br/>Properties</h3>
            <p className={styles.cardSubtitle}>High ROI Potential</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
