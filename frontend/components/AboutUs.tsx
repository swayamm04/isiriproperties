import Image from "next/image";
import { Home, ShieldCheck, Tag, Headset } from "lucide-react";
import styles from "./AboutUs.module.css";

export default function AboutUs() {
  const renderCards = (className: string) => (
    <div className={className}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          <Home size={20} strokeWidth={2} />
        </div>
        <h3 className={styles.featureTitle}>Wide Range of Properties</h3>
        <p className={styles.featureDesc}>Choose from apartments, villas, commercial spaces and more.</p>
      </div>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          <ShieldCheck size={20} strokeWidth={2} />
        </div>
        <h3 className={styles.featureTitle}>Trusted and Verified</h3>
        <p className={styles.featureDesc}>All properties are verified for quality and authenticity.</p>
      </div>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          <Tag size={20} strokeWidth={2} />
        </div>
        <h3 className={styles.featureTitle}>Best Price Guarantee</h3>
        <p className={styles.featureDesc}>We ensure the best deals and value for your money.</p>
      </div>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          <Headset size={20} strokeWidth={2} />
        </div>
        <h3 className={styles.featureTitle}>Expert Support</h3>
        <p className={styles.featureDesc}>Our experts are here to help you at every step.</p>
      </div>
    </div>
  );

  return (
    <section className={styles.section} id="about">
      <div className={styles.container}>
        {/* Left Column: Image & Tagline */}
        <div className={styles.leftColumn}>
          <span className={`${styles.tagline} ${styles.mobileTagline}`}>About Us</span>
          <div className={styles.imageWrapper}>
            <Image
              src="/about-us.png"
              alt="City Skyline"
              fill
              className={styles.aboutImage}
              sizes="(max-width: 968px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Right Column: Text & Metrics */}
        <div className={styles.rightColumn}>
          <span className={`${styles.tagline} ${styles.desktopTagline}`}>About Us</span>
          <h2 className={styles.heading}>
            Building Better Futures
          </h2>
          <p className={styles.description}>
            At I Siri Properties, we believe in more than just buildings – we believe in creating spaces that inspire, connect, and elevate lives. With years of experience in real estate, we are committed to providing exceptional service and trusted solutions.
          </p>
          {renderCards(`${styles.featuresGrid} ${styles.desktopOnly}`)}
        </div>
      </div>
      {renderCards(`${styles.featuresGrid} ${styles.mobileOnly}`)}
    </section>
  );
}
