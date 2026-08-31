"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Building2, Eye, EyeOff, Phone, Search, Home, LayoutGrid, ClipboardList, User, Heart, ShoppingCart, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { apiRequest } from "@/utils/api";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedType(sessionStorage.getItem("homeListingType") || "All");
      
      const handleTypeChange = () => {
        setSelectedType(sessionStorage.getItem("homeListingType") || "All");
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (desktopSearchQuery.trim().length >= 2) {
        setIsSearching(true);
        let url = `/properties?status=available&search=${desktopSearchQuery.trim()}`;
        if (selectedType !== "All") {
          url += `&listingType=${selectedType}`;
        }
        apiRequest(url)
          .then((data) => {
            setSuggestions(data);
          })
          .catch((err) => console.error(err))
          .finally(() => setIsSearching(false));
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [desktopSearchQuery]);

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

  const handleDesktopSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (desktopSearchQuery.trim()) {
      let url = `/properties?search=${encodeURIComponent(desktopSearchQuery.trim())}`;
      if (selectedType !== "All") {
        url += `&listingType=${selectedType}`;
      }
      router.push(url);
      setIsDesktopSearchOpen(false);
      setDesktopSearchQuery("");
    }
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <div className="global-nav-logo-wrapper" style={{ display: "flex", alignItems: "center", height: "50px" }}>
              <Image src="/logo-v2.png" alt="Plot&Acre" width={280} height={140} className="brand-logo-image" />
            </div>
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

            <div className={styles.desktopSearchWrapper}>
              <button 
                className={styles.desktopSearchIconBtn}
                onClick={() => setIsDesktopSearchOpen(!isDesktopSearchOpen)}
              >
                <Search size={18} />
              </button>
              <form 
                onSubmit={handleDesktopSearch} 
                className={`${styles.desktopSearchForm} ${isDesktopSearchOpen ? styles.desktopSearchFormOpen : ""}`}
              >
                <div className={styles.desktopSearchInputContainer}>
                  <input
                    type="text"
                    placeholder="Search properties..."
                    className={styles.desktopSearchInput}
                    value={desktopSearchQuery}
                    onChange={(e) => setDesktopSearchQuery(e.target.value)}
                    onBlur={() => {
                      // Slight delay to allow clicks on the icon or submit
                      setTimeout(() => setIsDesktopSearchOpen(false), 200);
                    }}
                  />
                  {isSearching && <div className={styles.searchSpinner}></div>}
                </div>
                
                {isDesktopSearchOpen && suggestions.length > 0 && (
                  <div className={styles.suggestionsDropdown}>
                    {suggestions.map((prop) => (
                      <div 
                        key={prop._id} 
                        className={styles.suggestionItem}
                        onMouseDown={(e) => {
                          // use onMouseDown instead of onClick so it fires before onBlur
                          e.preventDefault();
                          setIsDesktopSearchOpen(false);
                          setDesktopSearchQuery("");
                          router.push(`/properties/${prop.propertyId || prop._id}`);
                        }}
                      >
                        <div className={styles.suggestionImage}>
                          <img src={prop.images?.[0] || "/prop-1.png"} alt={prop.title} />
                        </div>
                        <div className={styles.suggestionTextContainer}>
                          <div className={styles.suggestionTitle}>{prop.title}</div>
                          <div className={styles.suggestionSubtitle}>{prop.location}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {isDesktopSearchOpen && suggestions.length === 0 && desktopSearchQuery.length >= 2 && !isSearching && (
                  <div className={styles.suggestionsDropdown}>
                    <div className={styles.suggestionNoResults}>No results found</div>
                  </div>
                )}
              </form>
            </div>

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
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                  <span className={styles.userInfo}>Hi, {user.name.split(" ")[0]}</span>
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)" }} />
                  ) : (
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--color-primary)", color: "var(--color-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "16px" }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
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
                  <button className={`${styles.toggleBtn} ${selectedType === 'All' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('All')}>All</button>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Sell' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Sell')}>Buy</button>
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
                  <button className={`${styles.toggleBtn} ${selectedType === 'All' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('All')}>All</button>
                  <button className={`${styles.toggleBtn} ${selectedType === 'Sell' ? styles.toggleBtnActive : ''}`} onClick={() => handleSelection('Sell')}>Buy</button>
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
            ) : (
              <Link href="/login" className={styles.mobileLogin}>
                <span>Login Free</span>
                <LogIn size={14} />
              </Link>
            )}
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
