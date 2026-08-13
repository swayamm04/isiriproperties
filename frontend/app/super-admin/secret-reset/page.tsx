"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { apiRequest } from "@/utils/api";
import { AlertTriangle } from "lucide-react";
import styles from "./page.module.css";

export default function SecretResetPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "super_admin") {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== "super_admin") {
    return <div style={{ minHeight: "80vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>;
  }

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await apiRequest("/superadmin/properties/reset-ids", {
        method: "PUT",
      });
      alert(res.message || "Properties reset successfully!");
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to reset properties.");
    } finally {
      setIsResetting(false);
      setShowModal(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>System Administration</h1>
        <p className={styles.description}>
          You have accessed the hidden system administration page. This area is reserved for highly sensitive operations that affect the core database structure.
        </p>
        
        <div className={styles.warning}>
          <strong>Notice:</strong> The action below will reorder and rename the Reference IDs of all properties in the database to close any gaps caused by deletions.
        </div>

        <button 
          className={styles.resetBtn}
          onClick={() => setShowModal(true)}
        >
          Reset All Property IDs
        </button>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AlertTriangle size={48} className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Are you absolutely sure?</h2>
            <p className={styles.modalDescription}>
              This action cannot be undone. All properties will be reassigned new sequential Reference IDs starting from #0001. Any external links, bookmarks, or saved references using the old IDs will break permanently.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? "Resetting..." : "Yes, Reset Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
