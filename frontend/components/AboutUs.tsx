import Image from "next/image";
import { Layers, TrendingUp, Folder, Megaphone, Scale, Eye } from "lucide-react";
import styles from "./AboutUs.module.css";

export default function AboutUs() {
  const solutions = [
    {
      title: "LAYOUT SITES",
      icon: <Layers size={20} strokeWidth={2} />,
      text: "Fully conceptualized dynamic layout infrastructure schemes featuring premium wide asphalt layouts, architectural modern streetlamps, and concrete utility spaces."
    },
    {
      title: "PROPERTY INVESTMENT",
      icon: <TrendingUp size={20} strokeWidth={2} />,
      text: "Advanced real estate yield diagnostics and data-backed localized forecasting mapping parameters across the Kadur-Hassan corridor to secure immediate appreciation."
    },
    {
      title: "DOCUMENTATION SUPPORT",
      icon: <Folder size={20} strokeWidth={2} />,
      text: "Rigorous management of clear titles, structural cross-verifications, fast Khata alterations, and legal framework navigation for error-free transactions."
    },
    {
      title: "PROPERTY MARKETING",
      icon: <Megaphone size={20} strokeWidth={2} />,
      text: "High-end cinematic asset positioning, ultra-high-definition digital visualization networks, and calculated transactional strategies to move high-value listings efficiently."
    },
    {
      title: "LEGAL GUIDANCE",
      icon: <Scale size={20} strokeWidth={2} />,
      text: "Complete compliance tracking in perfect agreement with statutory land-use acts and governmental town planning parameters."
    },
    {
      title: "SITE VISITS",
      icon: <Eye size={20} strokeWidth={2} />,
      text: "Transparent, personalized executive site presentation workflows detailing structural design constraints and plot orientation benefits directly on-field."
    }
  ];

  const renderCards = (className: string) => (
    <div className={className}>
      {solutions.map((item, index) => (
        <div key={index} className={styles.featureCard}>
          <div className={styles.featureIcon}>
            {item.icon}
          </div>
          <div className={styles.featureTextWrapper}>
            <h3 className={styles.featureTitle}>{item.title}</h3>
            <p className={styles.featureDesc}>{item.text}</p>
          </div>
        </div>
      ))}
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
            At Isiri Properties, we believe in more than just buildings – we believe in creating spaces that inspire, connect, and elevate lives. With years of experience in real estate, we are committed to providing exceptional service and trusted solutions.
          </p>
          {renderCards(`${styles.featuresGrid} ${styles.desktopOnly}`)}
        </div>
      </div>
      {renderCards(`${styles.featuresGrid} ${styles.mobileOnly}`)}
    </section>
  );
}
