import Image from "next/image";
import styles from "./AboutUs.module.css";

export default function AboutUs() {
  return (
    <section className={styles.section} id="about">
      <div className={styles.container}>
        {/* Left Column: Text Content */}
        <div className={styles.leftColumn}>
          <span className={styles.tagline}>Who We Are</span>
          <h2 className={styles.heading}>
            Pioneering Luxury Real Estate With Sophistication and Purpose
          </h2>
          <p className={styles.description}>
            At I Siri Properties, we redefine the art of luxury living. We curating only the most exceptional residential architecture that harmonizes structure, landscape, and lifestyle. Every residence in our portfolio is selected for its bespoke character, uncompromising construction quality, and architectural significance.
          </p>
          <p className={styles.description}>
            Our experienced advisory team provides private brokerage services tailored to discerning collectors of fine real estate. We value discretion, precision, and alignment with your architectural aspirations.
          </p>

          {/* Metrics */}
          <div className={styles.metrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>15+</span>
              <span className={styles.metricLabel}>Years advisory</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>$1.2B+</span>
              <span className={styles.metricLabel}>Sales Volume</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>99%</span>
              <span className={styles.metricLabel}>Client retention</span>
            </div>
          </div>
        </div>

        {/* Right Column: Architectural Image Accent */}
        <div className={styles.rightColumn}>
          <div className={styles.imageWrapper}>
            <Image
              src="/about-us.png"
              alt="I Siri Properties Editorial Architecture"
              fill
              className={styles.aboutImage}
              sizes="(max-width: 968px) 100vw, 50vw"
              priority
            />
          </div>
          <div className={styles.accentBox}>
            <span className={styles.accentTitle}>Design Ethos</span>
            <span className={styles.accentSub}>Symmetry, Space & Light</span>
          </div>
        </div>
      </div>
    </section>
  );
}
