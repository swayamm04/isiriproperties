import styles from "./FeaturesBanner.module.css";
import { Home, ShieldCheck, Tag, Headset } from "lucide-react";

export default function FeaturesBanner() {
  const features = [
    {
      icon: <Home size={32} strokeWidth={1.5} />,
      title: "Wide Range of Properties",
      description: "Choose from apartments, villas, commercial spaces and more.",
    },
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} />,
      title: "Trusted and Verified",
      description: "All properties are verified for quality and authenticity.",
    },
    {
      icon: <Tag size={32} strokeWidth={1.5} />,
      title: "Best Price Guarantee",
      description: "We ensure the best deals and value for your money.",
    },
    {
      icon: <Headset size={32} strokeWidth={1.5} />,
      title: "Expert Support",
      description: "Our experts are here to help you at every step.",
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        {features.map((feat, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.iconWrapper}>{feat.icon}</div>
            <h3 className={styles.title}>{feat.title}</h3>
            <p className={styles.description}>{feat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
