import React from "react";
import styles from "./CorporateSolutions.module.css";
import { Layers, TrendingUp, Folder, Megaphone, Scale, Eye, Star } from "lucide-react";

export default function CorporateSolutions() {
  const solutions = [
    {
      title: "Layout Sites",
      icon: <Layers size={24} strokeWidth={1.5} />,
      text: "Fully conceptualized dynamic layout infrastructure schemes featuring premium wide asphalt layouts, architectural modern streetlamps, and concrete utility spaces."
    },
    {
      title: "Property Investment",
      icon: <TrendingUp size={24} strokeWidth={1.5} />,
      text: "Advanced real estate yield diagnostics and data-backed localized forecasting mapping parameters across the Kadur-Hassan corridor to secure immediate appreciation."
    },
    {
      title: "Documentation Support",
      icon: <Folder size={24} strokeWidth={1.5} />,
      text: "Rigorous management of clear titles, structural cross-verifications, fast Khata alterations, and legal framework navigation for error-free transactions."
    },
    {
      title: "Property Marketing",
      icon: <Megaphone size={24} strokeWidth={1.5} />,
      text: "High-end cinematic asset positioning, ultra-high-definition digital visualization networks, and calculated transactional strategies to move high-value listings efficiently."
    },
    {
      title: "Legal Guidance",
      icon: <Scale size={24} strokeWidth={1.5} />,
      text: "Complete compliance tracking in perfect agreement with statutory land-use acts and governmental town planning parameters."
    },
    {
      title: "Site Visits",
      icon: <Eye size={24} strokeWidth={1.5} />,
      text: "Transparent, personalized executive site presentation workflows detailing structural design constraints and plot orientation benefits directly on-field."
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Corporate <span className={styles.titleHighlight}>Solutions & Pillars</span>
          </h2>
          <div className={styles.subtitle}>
            ENGINEERED REAL ESTATE EXCELLENCE
          </div>
          <div className={styles.starDivider}>
            <span className={styles.line}></span>
            <Star size={14} fill="var(--color-primary)" color="var(--color-primary)" />
            <span className={styles.line}></span>
          </div>
        </div>

        <div className={styles.grid}>
          {solutions.map((item, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.iconWrapper}>
                {item.icon}
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardText}>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
