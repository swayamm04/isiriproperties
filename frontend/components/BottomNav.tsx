"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Building2, ClipboardList, User, Heart, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/authContext";
import styles from "./Navbar.module.css";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path === "/properties" && pathname === "/properties") return true;
    if (path === "/wishlist" && pathname === "/wishlist") return true;
    if (path.startsWith("/admin") && pathname.startsWith("/admin")) return true;
    if (path.startsWith("/super-admin") && pathname.startsWith("/super-admin")) return true;
    if (path === "/settings" && pathname === "/settings") return true;
    return false;
  };

  const openAuthModal = (mode: string) => {
    const event = new CustomEvent("openAuthModal", { detail: { mode } });
    window.dispatchEvent(event);
  };

  return (
    <div className={styles.bottomNav}>
      <Link href="/" className={`${styles.bottomNavLink} ${isActive("/") ? styles.bottomNavLinkActive : ""}`}>
        <Compass size={24} strokeWidth={isActive("/") ? 2 : 1.5} />
        <span className={styles.bottomNavLabel}>Explore</span>
      </Link>
      <Link href="/properties" className={`${styles.bottomNavLink} ${isActive("/properties") ? styles.bottomNavLinkActive : ""}`}>
        <Building2 size={24} strokeWidth={isActive("/properties") ? 2 : 1.5} />
        <span className={styles.bottomNavLabel}>Properties</span>
      </Link>

      {user ? (
        <>
          {user.role === "user" ? (
            <Link
              href="/wishlist"
              className={`${styles.bottomNavLink} ${isActive("/wishlist") ? styles.bottomNavLinkActive : ""}`}
            >
              <ClipboardList size={24} strokeWidth={isActive("/wishlist") ? 2 : 1.5} />
              <span className={styles.bottomNavLabel}>Wishlist</span>
            </Link>
          ) : (
            <Link
              href={user.role === "admin" ? "/admin/dashboard" : "/super-admin/dashboard"}
              className={`${styles.bottomNavLink} ${isActive(user.role === "admin" ? "/admin/dashboard" : "/super-admin/dashboard") ? styles.bottomNavLinkActive : ""}`}
            >
              <LayoutDashboard size={24} strokeWidth={isActive(user.role === "admin" ? "/admin/dashboard" : "/super-admin/dashboard") ? 2 : 1.5} />
              <span className={styles.bottomNavLabel}>Dashboard</span>
            </Link>
          )}
          <Link
            href="/settings"
            className={`${styles.bottomNavLink} ${isActive("/settings") ? styles.bottomNavLinkActive : ""}`}
          >
            <User size={24} strokeWidth={isActive("/settings") ? 2 : 1.5} />
            <span className={styles.bottomNavLabel}>Profile</span>
          </Link>
        </>
      ) : (
        <>
          <Link href="/login?mode=login" className={styles.bottomNavLink}>
            <ClipboardList size={24} strokeWidth={1.5} />
            <span className={styles.bottomNavLabel}>Wishlist</span>
          </Link>
          <Link href="/login?mode=login" className={styles.bottomNavLink}>
            <User size={24} strokeWidth={1.5} />
            <span className={styles.bottomNavLabel}>Login</span>
          </Link>
        </>
      )}
    </div>
  );
}
