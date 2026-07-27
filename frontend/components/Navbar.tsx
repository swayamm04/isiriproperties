"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Building2, Eye, EyeOff, Phone, Search, Home, LayoutGrid, ClipboardList, User, Heart, ShoppingCart, Lock } from "lucide-react";
import { useAuth } from "@/context/authContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Sell");
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedType(sessionStorage.getItem("homeListingType") || "Sell");
      
      const handleTypeChange = () => {
        setSelectedType(sessionStorage.getItem("homeListingType") || "Sell");
      };
      
      window.addEventListener("homeListingTypeChanged", handleTypeChange);
      return () => window.removeEventListener("homeListingTypeChanged", handleTypeChange);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleSelection = (type: string) => {
    if (type === selectedType) return;
    
    setSelectedType(type);
    sessionStorage.setItem("homeListingType", type);
    window.dispatchEvent(new Event("homeListingTypeChanged"));
  };

  // Helper to determine if link is active
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path === "/properties" && pathname === "/properties") return true;
    if (path === "/wishlist" && pathname === "/wishlist") return true;
    if (path.startsWith("/admin") && pathname.startsWith("/admin")) return true;
    if (path.startsWith("/super-admin") && pathname.startsWith("/super-admin")) return true;
    return false;
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <Image src="/logo.png" alt="I Siri Properties" width={180} height={60} style={{ objectFit: "contain", height: "auto" }} />
          </Link>

          {/* Desktop Nav Links */}
          <div className={styles.navLinks}>
            <Link
              href="/"
              className={`${styles.navLink} ${isActive("/") ? styles.navLinkActive : ""}`}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className={`${styles.navLink} ${isActive("/properties") ? styles.navLinkActive : ""}`}
            >
              Properties
            </Link>


            {/* Role-based Links */}
            {user && user.role === "user" && (
              <Link
                href="/wishlist"
                className={`${styles.navLink} ${isActive("/wishlist") ? styles.navLinkActive : ""}`}
              >
                Wishlist
              </Link>
            )}

            {user && user.role === "admin" && (
              <Link
                href="/admin/dashboard"
                className={`${styles.navLink} ${isActive("/admin/dashboard") ? styles.navLinkActive : ""}`}
              >
                Admin Panel
              </Link>
            )}

            {user && user.role === "super_admin" && (
              <Link
                href="/super-admin/dashboard"
                className={`${styles.navLink} ${isActive("/super-admin/dashboard") ? styles.navLinkActive : ""}`}
              >
                Super Admin
              </Link>
            )}

            {/* Auth / Greeting */}
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span className={styles.userInfo}>Hi, {user.name.split(" ")[0]}</span>
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }} />
                ) : (
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--color-primary)", color: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                  className={styles.ctaButton}
                  style={{ padding: "0.4rem 1rem", fontSize: "0.75rem" }}
                >
                  Logout
                </button>
                <div className={styles.desktopToggle}>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Sell' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Sell')}>Sell</button>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Rent' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Rent')}>Rent</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <Link
                  href="/login"
                  className={styles.ctaButton}
                >
                  Login Free
                </Link>
                <div className={styles.desktopToggle}>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Sell' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Sell')}>Sell</button>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Rent' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Rent')}>Rent</button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Actions (Search + Menu) */}
          <div className={styles.mobileActions}>
            {user ? (
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-dark)" }}>Hi, {user.name.split(" ")[0]}</span>
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }} />
                ) : (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--color-primary)", color: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Overlay */}
      <div
        className={`${styles.overlay} ${isMenuOpen ? styles.overlayVisible : ""}`}
        onClick={closeMenu}
      />

      {/* Mobile Drawer */}
      <div className={`${styles.mobileDrawer} ${isMenuOpen ? styles.drawerOpen : ""}`}>
        <button className={styles.drawerCloseBtn} onClick={toggleMenu} aria-label="Close Menu">
          <X size={24} />
        </button>

        <div className={styles.drawerLinks}>
          <Link
            href="/"
            className={styles.drawerLink}
            onClick={closeMenu}
          >
            Home
          </Link>
          <Link
            href="/properties"
            className={styles.drawerLink}
            onClick={closeMenu}
          >
            Properties
          </Link>

          {user && user.role === "user" && (
            <Link
              href="/wishlist"
              className={styles.drawerLink}
              onClick={closeMenu}
            >
              Wishlist
            </Link>
          )}

          {user && user.role === "admin" && (
            <Link
              href="/admin/dashboard"
              className={styles.drawerLink}
              onClick={closeMenu}
            >
              Admin Panel
            </Link>
          )}

          {user && user.role === "super_admin" && (
            <Link
              href="/super-admin/dashboard"
              className={styles.drawerLink}
              onClick={closeMenu}
            >
              Super Admin
            </Link>
          )}

          {user ? (
            <div style={{ marginTop: "1rem" }}>
              <div className={styles.userInfo} style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "10px" }}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }} />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--color-primary)", color: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                Logged in as: {user.name}
              </div>
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                  window.location.href = "/";
                }}
                className={styles.mobileAuthBtn}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={styles.mobileAuthBtn}
              onClick={closeMenu}
            >
              Login Free
            </Link>
          )}
        </div>
      </div>

    </>
  );
}
