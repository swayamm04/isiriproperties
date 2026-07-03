import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <div className={styles.logo}>
            I Siri <span className={styles.logoGold}>Properties</span>
          </div>
          <p className={styles.brandText}>
            Specialists in fine architectural properties, curate estates, and luxury penthouses. Committed to excellence, discretion, and architectural integrity.
          </p>
        </div>

        {/* Quick Links Column */}
        <div>
          <h4 className={styles.colTitle}>Navigation</h4>
          <ul className={styles.linksList}>
            <li>
              <Link href="/" className={styles.link}>Home</Link>
            </li>
            <li>
              <Link href="/#about" className={styles.link}>About Us</Link>
            </li>
            <li>
              <Link href="/properties" className={styles.link}>Properties</Link>
            </li>
            <li>
              <Link href="/#testimonials" className={styles.link}>Testimonials</Link>
            </li>
            <li>
              <Link href="/#contact" className={styles.link}>Contact Us</Link>
            </li>
          </ul>
        </div>

        {/* Categories Column */}
        <div>
          <h4 className={styles.colTitle}>Collections</h4>
          <ul className={styles.linksList}>
            <li>
              <Link href="/properties?type=Villa" className={styles.link}>Luxury Villas</Link>
            </li>
            <li>
              <Link href="/properties?type=Penthouse" className={styles.link}>Sky Penthouses</Link>
            </li>
            <li>
              <Link href="/properties?type=Chalet" className={styles.link}>Mountain Chalets</Link>
            </li>
            <li>
              <Link href="/properties" className={styles.link}>All Portfolios</Link>
            </li>
          </ul>
        </div>

        {/* Contact/Location Column */}
        <div>
          <h4 className={styles.colTitle}>Advisory Office</h4>
          <div className={styles.contactText}>
            <p style={{ marginBottom: "0.75rem" }}>
              02, Basaveshwara complex, 60 Feet Rd,<br />
              near kariyanna building, Adarsh Layout,<br />
              Vinoba Nagara, Shivamogga, KA 577204
            </p>
            <p style={{ marginBottom: "0.75rem" }}>
              T: +91 99644 96644 / 09964496644<br />
              E: advisory@isiriproperties.com
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal Row */}
      <div className={styles.bottomRow}>
        <div className={styles.copyright}>
          &copy; {currentYear} I Siri Properties. All rights reserved. Designed for elite spaces.
        </div>
        <div className={styles.legalLinks}>
          <Link href="/properties" className={styles.legalLink}>Privacy Policy</Link>
          <Link href="/properties" className={styles.legalLink}>Terms of Service</Link>
          <Link href="/properties" className={styles.legalLink}>ADA Compliance</Link>
        </div>
      </div>
    </footer>
  );
}
