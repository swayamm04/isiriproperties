"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Building2, Eye, EyeOff, Phone, Search } from "lucide-react";
import { useAuth } from "@/context/authContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  
  const { user, login, signup, logout, error, clearError } = useAuth();

  // Auth modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Eye icon toggle state
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const handleOpenAuth = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAuthMode(customEvent.detail?.mode || "login");
      setValidationError("");
      clearError();
      setIsModalOpen(true);
      setShowPassword(false);
      setIsMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("openAuthModal", handleOpenAuth);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("openAuthModal", handleOpenAuth);
    };
  }, [clearError]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const openAuthModal = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setValidationError("");
    clearError();
    setIsModalOpen(true);
    setShowPassword(false); // Reset visibility when opening
    closeMenu();
  };

  const closeAuthModal = () => {
    setIsModalOpen(false);
    setEmail("");
    setPassword("");
    setName("");
    setPhone("");
    setCity("");
    setValidationError("");
    setShowPassword(false); // Reset visibility when closing
    clearError();
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        if (!email || !password) {
          setValidationError("Email/Username and Password are required.");
          setAuthLoading(false);
          return;
        }
        await login(email, password);
      } else {
        if (!name || !email || !phone || !city || !password) {
          setValidationError("All fields are required.");
          setAuthLoading(false);
          return;
        }
        await signup({ name, email, phone, city, password });
      }
      closeAuthModal();
    } catch {
      // Errors handled by context
    } finally {
      setAuthLoading(false);
    }
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
            <Link 
              href="/#contact" 
              className={`${styles.navLink} ${isActive("/#contact") ? styles.navLinkActive : ""}`}
            >
              Contact
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
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <span className={styles.userInfo}>Hi, {user.name.split(" ")[0]}</span>
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
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <button 
                  onClick={() => openAuthModal("login")} 
                  className={styles.ctaButton}
                >
                  Login Free
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions (Search + Menu) */}
          <div className={styles.mobileActions}>
            <Link href="/properties#search" aria-label="Search Properties" style={{ color: "var(--color-dark)", display: "flex", alignItems: "center" }}>
              <Search size={22} strokeWidth={1.5} />
            </Link>
            <button className={styles.mobileMenuBtn} onClick={toggleMenu} aria-label="Toggle Menu">
              <Menu size={24} />
            </button>
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
              <div className={styles.userInfo} style={{ marginBottom: "1rem" }}>Logged in as: {user.name}</div>
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
            <button 
              onClick={() => openAuthModal("login")} 
              className={styles.mobileAuthBtn} 
            >
              Login Free
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAuthModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={closeAuthModal} aria-label="Close Modal">
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle}>
              {authMode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className={styles.modalSubtitle}>
              {authMode === "login" ? "Sign in to access exclusive estates" : "Register to start your property wishlist"}
            </p>

            <form onSubmit={handleAuthSubmit}>
              {/* Validation or API error display */}
              {(validationError || error) && (
                <div className={styles.errorMsg}>
                  {validationError || error}
                </div>
              )}

              {authMode === "signup" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 98765 43210"
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>City</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bengaluru"
                      value={city} 
                      onChange={(e) => setCity(e.target.value)}
                      className={styles.inputField}
                      required
                    />
                  </div>
                </>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Username / Email ID</label>
                <input 
                  type="email" 
                  placeholder="e.g. email@isiri.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.inputField}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.inputField}
                    style={{ width: "100%", paddingRight: "3rem" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "1rem",
                      background: "none",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.6)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} style={{ strokeWidth: 1.5 }} /> : <Eye size={18} style={{ strokeWidth: 1.5 }} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn} 
                disabled={authLoading}
              >
                {authLoading ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
              </button>
            </form>

            <div className={styles.switchText}>
              {authMode === "login" ? (
                <>
                  New user? 
                  <button 
                    onClick={() => openAuthModal("signup")} 
                    className={styles.switchBtn}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Old user? 
                  <button 
                    onClick={() => openAuthModal("login")} 
                    className={styles.switchBtn}
                  >
                    Login here
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
