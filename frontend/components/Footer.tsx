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
            <Image src="/logo.png" alt="I Siri Properties" width={180} height={60} style={{ objectFit: "contain", height: "auto" }} />
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
            <li>
              <Link href="/#contact" className={styles.link}>Contact Us</Link>
            </li>
          </ul>
        </div>



      </div>

      {/* Bottom Legal Row */}
      <div className={styles.bottomRow}>
        <div className={styles.copyright}>
          &copy; {currentYear} I Siri Properties. All rights reserved. Designed for elite spaces.
        </div>
      </div>
    </footer>
  );
}
