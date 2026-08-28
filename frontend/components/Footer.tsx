import Link from "next/link";
import Image from "next/image";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Brand Column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.logo}>
            <div style={{ display: "flex", alignItems: "center", height: "50px" }}>
              <Image src="/logo-updated.png" alt="Plot&Acre" width={280} height={140} className="brand-logo-image" />
            </div>
          </Link>
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
          </ul>
        </div>

        {/* Contact Info Column */}
        <div>
          <h4 className={styles.colTitle}>Contact Us</h4>
          <ul className={styles.linksList} style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', lineHeight: '1.6' }}>
            <li style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Address:</strong><br />
              02, Basaveshwara complex, 60 Feet Rd,<br />
              near kariyanna building, Adarsh Layout,<br />
              Vinoba Nagara, Shivamogga, KA 577204
            </li>
            <li style={{ marginBottom: '1rem' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Phone:</strong><br />
              +91 99644 96644 / 09964496644
            </li>
            <li>
              <strong style={{ color: 'var(--color-primary)' }}>Email:</strong><br />
              contact@plotandacre.com
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Legal Row */}
      <div className={styles.bottomRow}>
        <div className={styles.copyright}>
          &copy; {currentYear} Plot&Acre. All rights reserved. Designed for elite spaces.
        </div>
      </div>
    </footer>
  );
}
