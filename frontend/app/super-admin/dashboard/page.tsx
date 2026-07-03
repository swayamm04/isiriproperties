"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { apiRequest, getImageUrl } from "@/utils/api";
import { 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  LayoutDashboard, 
  Home, 
  PlusCircle, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X, 
  MessageSquare, 
  Check,
  Shield,
  Eye
} from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

interface Stats {
  admins: number;
  users: number;
  totalProperties: number;
  soldProperties: number;
  availableProperties: number;
  pendingInquiries: number;
}

interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  isBlocked: boolean;
  createdAt: string;
}

interface Property {
  _id: string;
  propertyId: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  type: string;
  addedBy: string;
  addedByName: string;
  status: "available" | "sold";
}

interface InterestInquiry {
  _id: string;
  user: {
    id: string;
    name: string;
    phone: string;
    city: string;
    email: string;
  };
  property: {
    id: string;
    propertyId: string;
    title: string;
    location: string;
    price: number;
    addedByAdminName: string;
  };
  queryText: string;
  status: "new" | "reviewed";
  createdAt: string;
}

export default function SuperAdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"inquiries" | "admins" | "users" | "properties">("inquiries");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);

  // State values
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquiries, setInquiries] = useState<InterestInquiry[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  
  // Loading & Error states
  const [statsLoading, setStatsLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add/Edit Admin form state
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  // Add Property form state (Super Admin listing properties directly)
  const [propTitle, setPropTitle] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [propPrice, setPropPrice] = useState("");
  const [propType, setPropType] = useState("Villa");
  const [propBeds, setPropBeds] = useState("3");
  const [propBaths, setPropBaths] = useState("2.5");
  const [propArea, setPropArea] = useState("");
  const [propDescription, setPropDescription] = useState("");
  const [propSelectedFiles, setPropSelectedFiles] = useState<FileList | null>(null);
  const [propImageUrls, setPropImageUrls] = useState("");
  const [propAddLoading, setPropAddLoading] = useState(false);

  // Property filtering state
  const [selectedAdminId, setSelectedAdminId] = useState("");

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await apiRequest("/superadmin/stats");
      setStats(data);
    } catch (err: any) {
      console.error("Error loading stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTabData = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setTabLoading(true);

    try {
      if (activeTab === "inquiries") {
        const data = await apiRequest("/interest");
        setInquiries(data);
      } else if (activeTab === "admins") {
        const data = await apiRequest("/superadmin/admins");
        setAdmins(data);
      } else if (activeTab === "users") {
        const data = await apiRequest("/superadmin/users");
        setUsers(data);
      } else if (activeTab === "properties") {
        // Fetch properties (with optional admin filter)
        const endpoint = selectedAdminId 
          ? `/superadmin/properties?adminId=${selectedAdminId}` 
          : "/superadmin/properties";
        const data = await apiRequest(endpoint);
        setProperties(data);
      }
    } catch (err: any) {
      console.error(`Error loading data for ${activeTab}:`, err);
      setErrorMsg(err.message || "Failed to load tab information.");
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "super_admin") {
      router.push("/");
      return;
    }

    loadStats();
  }, [user, loading]);

  useEffect(() => {
    if (loading || !user || user.role !== "super_admin") return;
    loadTabData();
  }, [activeTab, selectedAdminId, user, loading]);

  // Actions: Inquiries
  const handleMarkReviewed = async (inquiryId: string) => {
    try {
      await apiRequest(`/interest/${inquiryId}/review`, {
        method: "PUT",
        body: JSON.stringify({ status: "reviewed" }),
      });
      setSuccessMsg("Inquiry marked as reviewed.");
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update review status.");
    }
  };

  // Actions: Add/Edit Admin Submit
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (editingAdminId) {
        // PUT /superadmin/admins/:id
        await apiRequest(`/superadmin/admins/${editingAdminId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: adminName,
            email: adminEmail,
            password: adminPassword || undefined,
          }),
        });
        setSuccessMsg(`Admin details updated successfully.`);
        setEditingAdminId(null);
      } else {
        // POST /superadmin/admins
        if (!adminName || !adminEmail || !adminPassword) {
          setErrorMsg("Please enter all required fields to register.");
          setAddAdminLoading(false);
          return;
        }
        await apiRequest("/superadmin/admins", {
          method: "POST",
          body: JSON.stringify({ name: adminName, email: adminEmail, password: adminPassword }),
        });
        setSuccessMsg(`Admin "${adminName}" created successfully.`);
      }
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save admin.");
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Actions: Add Property Submit (Super Admin)
  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropAddLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!propTitle || !propLocation || !propPrice || !propArea || !propDescription) {
      setErrorMsg("Please fill out all required fields.");
      setPropAddLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", propTitle);
      formData.append("location", propLocation);
      formData.append("price", propPrice);
      formData.append("type", propType);
      formData.append("beds", propBeds);
      formData.append("baths", propBaths);
      formData.append("area", propArea);
      formData.append("description", propDescription);
      formData.append("imageUrls", propImageUrls);

      if (propSelectedFiles && propSelectedFiles.length > 0) {
        for (let i = 0; i < propSelectedFiles.length; i++) {
          formData.append("imageFiles", propSelectedFiles[i]);
        }
      }

      await apiRequest("/properties", {
        method: "POST",
        body: formData,
      });

      setSuccessMsg("Property added successfully!");
      setPropTitle("");
      setPropLocation("");
      setPropPrice("");
      setPropType("Villa");
      setPropBeds("3");
      setPropBaths("2.5");
      setPropArea("");
      setPropDescription("");
      setPropSelectedFiles(null);
      setPropImageUrls("");

      const fileInput = document.getElementById("superImageFiles") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      loadStats();
      if (activeTab === "properties") {
        loadTabData();
      }

      setTimeout(() => {
        setIsAddPropModalOpen(false);
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to list property.");
    } finally {
      setPropAddLoading(false);
    }
  };

  // Actions: Edit Admin Trigger
  const startEditAdmin = (adm: AdminProfile) => {
    setEditingAdminId(adm._id);
    setAdminName(adm.name);
    setAdminEmail(adm.email);
    setAdminPassword("");
    
    const formBox = document.getElementById("adminFormBox");
    if (formBox) {
      formBox.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEditAdmin = () => {
    setEditingAdminId(null);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
  };

  // Actions: Delete Admin
  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (!confirm(`Are you sure you want to delete the admin "${adminName}"? They will lose access immediately.`)) {
      return;
    }

    try {
      await apiRequest(`/superadmin/admins/${adminId}`, {
        method: "DELETE",
      });
      setSuccessMsg(`Admin "${adminName}" deleted.`);
      if (editingAdminId === adminId) {
        cancelEditAdmin();
      }
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete admin.");
    }
  };

  // Actions: Block/Unblock User
  const handleToggleBlockUser = async (userId: string, userName: string, currentBlocked: boolean) => {
    const actionText = currentBlocked ? "unblock" : "block";
    if (!confirm(`Are you sure you want to ${actionText} user "${userName}"?`)) {
      return;
    }

    try {
      await apiRequest(`/superadmin/users/${userId}/block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked: !currentBlocked }),
      });
      setSuccessMsg(`User "${userName}" has been ${currentBlocked ? "unblocked" : "blocked"}.`);
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update user block status.");
    }
  };

  // Actions: Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete the user account for "${userName}"?`)) {
      return;
    }

    try {
      await apiRequest(`/superadmin/users/${userId}`, {
        method: "DELETE",
      });
      setSuccessMsg(`User "${userName}" account deleted.`);
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete user.");
    }
  };

  // Actions: Mark Property as Sold
  const handleToggleSoldProperty = async (propertyId: string, propertyTitle: string, currentStatus: "available" | "sold") => {
    const nextStatus = currentStatus === "available" ? "sold" : "available";
    if (!confirm(`Mark property "${propertyTitle}" as ${nextStatus === "sold" ? "SOLD" : "AVAILABLE"}?`)) {
      return;
    }

    try {
      await apiRequest(`/superadmin/properties/${propertyId}/sold`, {
        method: "PUT",
        body: JSON.stringify({ status: nextStatus }),
      });
      setSuccessMsg("Property status updated.");
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update property status.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-primary)" }}>
          Accessing Super Admin Command Center...
        </p>
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <p style={{ color: "#e05e5e" }}>Access Denied. Super Admin credentials required.</p>
      </div>
    );
  }

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "inquiries": return "Dashboard / Inquiries";
      case "admins": return "Supervision / Vendor Admins";
      case "users": return "Supervision / Registered Users";
      case "properties": return "Supervision / Global Properties";
      default: return "Dashboard";
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Left Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarBrand}>
          <Building2 className={styles.brandLogo} size={22} strokeWidth={1.5} />
          <span className={styles.brandName}>
            I Siri <span className={styles.brandGold}>Prop</span>
          </span>
        </div>

        <nav className={styles.sidebarMenu}>
          <button
            onClick={() => {
              setActiveTab("inquiries");
              cancelEditAdmin();
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "inquiries" ? styles.activeMenuItem : ""}`}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("admins");
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "admins" ? styles.activeMenuItem : ""}`}
          >
            <Shield size={18} strokeWidth={1.5} />
            <span>Manage Admins</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("users");
              cancelEditAdmin();
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "users" ? styles.activeMenuItem : ""}`}
          >
            <Users size={18} strokeWidth={1.5} />
            <span>Manage Users</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("properties");
              cancelEditAdmin();
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "properties" ? styles.activeMenuItem : ""}`}
          >
            <Home size={18} strokeWidth={1.5} />
            <span>All Properties</span>
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(197, 168, 128, 0.1)", paddingTop: "1rem" }}>
            <Link href="/" className={styles.menuItem}>
              <ExternalLink size={18} strokeWidth={1.5} />
              <span>Return to site</span>
            </Link>

            <button 
              onClick={() => {
                logout();
                window.location.href = "/";
              }} 
              className={styles.menuItem}
              style={{ width: "100%" }}
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          © {new Date().getFullYear()} I Siri Properties
        </div>
      </aside>

      {/* Main Wrapper Column */}
      <div className={styles.mainWrapper}>
        {/* Top Header Bar */}
        <header className={styles.headerBar}>
          <button 
            className={styles.menuToggle} 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle Navigation Drawer"
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className={styles.breadcrumb}>
            System <span className={styles.breadcrumbCurrent}>/ {getBreadcrumbTitle()}</span>
          </div>

          <div className={styles.profileArea}>
            <div className={styles.profileText}>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileRole}>Super Admin</div>
            </div>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className={styles.contentBody}>
          {/* Welcome greeting */}
          <div className={styles.welcomeSection}>
            <h1 className={styles.title}>
              {activeTab === "inquiries" ? "Dashboard" : activeTab === "admins" ? "Manage Vendor Admins" : activeTab === "users" ? "Manage Customer Users" : "Global Property Listings"}
            </h1>
            <p className={styles.subtitle}>
              Welcome back, {user.name.split(" ")[0]}. Here is the current status of your real estate platform.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {successMsg && <div className={styles.successBox}>{successMsg}</div>}

          {/* Tab Render Content */}
          {tabLoading ? (
            <p style={{ textAlign: "center", padding: "3rem", color: "var(--color-dark-muted)" }}>Loading records...</p>
          ) : (
            <>
              {activeTab === "inquiries" && (
                <div>
                  {/* Stats Overview Grid inside Dashboard (Inquiries) view only */}
                  {stats && (
                    <div className={styles.statsGrid}>
                      <div className={styles.statCard}>
                        <div className={styles.statInfo}>
                          <div className={styles.statVal}>{stats.pendingInquiries}</div>
                          <div className={styles.statLabel}>Pending Inquiries</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <MessageSquare size={20} strokeWidth={1.5} />
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <div className={styles.statInfo}>
                          <div className={styles.statVal}>{stats.admins}</div>
                          <div className={styles.statLabel}>Active Admins</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <Shield size={20} strokeWidth={1.5} />
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <div className={styles.statInfo}>
                          <div className={styles.statVal}>{stats.users}</div>
                          <div className={styles.statLabel}>Registered Users</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <Users size={20} strokeWidth={1.5} />
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <div className={styles.statInfo}>
                          <div className={styles.statVal}>{stats.totalProperties}</div>
                          <div className={styles.statLabel}>Total Properties</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <Home size={20} strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>
                  )}

                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1.5rem", fontWeight: 400 }}>
                    Recent Client Interest Inquiries
                  </h3>
                  {inquiries.length > 0 ? (
                    <div className={styles.inquiriesList}>
                      {inquiries.map((inq) => {
                        const formattedPrice = new Intl.NumberFormat("en-IN", {
                          style: "currency",
                          currency: "INR",
                          maximumFractionDigits: 0,
                        }).format(inq.property.price);

                        return (
                          <div
                            key={inq._id}
                            className={`${styles.inquiryCard} ${inq.status === "new" ? styles.inquiryNew : styles.inquiryReviewed}`}
                          >
                            <span className={`${styles.inquiryBadge} ${inq.status === "new" ? styles.badgeNew : styles.badgeReviewed}`}>
                              {inq.status === "new" ? "New Query" : "Reviewed"}
                            </span>

                            <div className={styles.inquiryMeta}>
                              <div className={styles.metaBlock}>
                                <div className={styles.metaBlockTitle}>Prospect Information</div>
                                <div className={styles.metaItem}>Name: <strong>{inq.user.name}</strong></div>
                                <div className={styles.metaItem}>Phone: <strong>{inq.user.phone}</strong></div>
                                <div className={styles.metaItem}>City: <strong>{inq.user.city}</strong></div>
                                <div className={styles.metaItem}>Email ID: <strong>{inq.user.email}</strong></div>
                              </div>

                              <div className={styles.metaBlock}>
                                <div className={styles.metaBlockTitle}>Property Details</div>
                                <div className={styles.metaItem}>Ref ID: <strong>#{inq.property.propertyId}</strong></div>
                                <div className={styles.metaItem}>Title: <strong>{inq.property.title}</strong></div>
                                <div className={styles.metaItem}>Location: <strong>{inq.property.location}</strong></div>
                                <div className={styles.metaItem}>Value: <strong>{formattedPrice}</strong></div>
                                <div className={styles.metaItem}>Vendor Admin: <strong>{inq.property.addedByAdminName}</strong></div>
                              </div>
                            </div>

                            <div className={styles.inquiryText}>
                              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-dark-muted)", marginBottom: "0.5rem" }}>
                                Query Message:
                              </div>
                              "{inq.queryText}"
                            </div>

                            {inq.status === "new" && (
                              <button
                                onClick={() => handleMarkReviewed(inq._id)}
                                className={styles.reviewActionBtn}
                              >
                                Mark as Reviewed
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyMsg}>No interest inquiries registered in the database.</div>
                  )}
                </div>
              )}

              {activeTab === "admins" && (
                <div style={{ gridTemplateColumns: "1.2fr 0.8fr", gap: "3rem", alignItems: "start", display: "grid" }}>
                  {/* Active Admins List */}
                  <div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1.5rem", fontWeight: 400 }}>
                      Active Vendor Accounts
                    </h3>
                    {admins.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email ID</th>
                              <th>Created On</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {admins.map((adm) => (
                              <tr key={adm._id}>
                                <td style={{ fontWeight: 500 }}>{adm.name}</td>
                                <td>{adm.email}</td>
                                <td>{new Date(adm.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                                    <button
                                      onClick={() => startEditAdmin(adm)}
                                      title="Edit Admin"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary-dark)", padding: 0 }}
                                    >
                                      <Edit size={16} strokeWidth={1.8} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAdmin(adm._id, adm.name)}
                                      title="Delete Admin"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "#e05e5e", padding: 0 }}
                                    >
                                      <Trash2 size={16} strokeWidth={1.8} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className={styles.emptyMsg}>No admins registered yet. Fill out the registration form.</div>
                    )}
                  </div>

                  {/* Register Form */}
                  <div className={styles.formBox} id="adminFormBox">
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1.5rem", fontWeight: 400 }}>
                      {editingAdminId ? "Edit Admin Details" : "Register Vendor Admin"}
                    </h3>
                    <form onSubmit={handleAddAdminSubmit}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Admin Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rachel Green"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          className={styles.input}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Email ID</label>
                        <input
                          type="email"
                          placeholder="e.g. rachel@isiri.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className={styles.input}
                          required
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>
                          {editingAdminId ? "New Password (optional)" : "Default Password"}
                        </label>
                        <input
                          type="password"
                          placeholder={editingAdminId ? "Leave blank to keep current" : "••••••••"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          className={styles.input}
                          required={!editingAdminId}
                        />
                      </div>

                      <button type="submit" className={styles.submitBtn} disabled={addAdminLoading} style={{ width: "100%", marginBottom: editingAdminId ? "1rem" : 0 }}>
                        {addAdminLoading ? "Saving..." : editingAdminId ? "Update Admin Account" : "Add Admin Account"}
                      </button>
                      
                      {editingAdminId && (
                        <button 
                          type="button" 
                          onClick={cancelEditAdmin}
                          className={styles.submitBtn}
                          style={{ width: "100%", backgroundColor: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-border)" }}
                        >
                          Cancel Edit
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1.5rem", fontWeight: 400 }}>
                    Registered Users
                  </h3>
                  {users.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>City</th>
                            <th>Email / Username</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((u) => (
                            <tr key={u._id}>
                              <td style={{ fontWeight: 500 }}>{u.name}</td>
                              <td>{u.phone}</td>
                              <td>{u.city}</td>
                              <td>{u.email}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: u.isBlocked ? "#e05e5e" : "#4eb570" }}>
                                  {u.isBlocked ? "Blocked" : "Active"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                  <button
                                    onClick={() => handleToggleBlockUser(u._id, u.name, u.isBlocked)}
                                    className={`${styles.actionBtn} ${u.isBlocked ? styles.unblockBtn : styles.blockBtn}`}
                                    style={{ textDecoration: "none", border: "1px solid var(--color-border)", padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                                  >
                                    {u.isBlocked ? "Unblock" : "Block"}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                    title="Delete User"
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "#e05e5e", padding: 0 }}
                                  >
                                    <Trash2 size={16} strokeWidth={1.8} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyMsg}>No users registered on the platform yet.</div>
                  )}
                </div>
              )}

              {activeTab === "properties" && (
                <div>
                  <div className={styles.filterBar}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400 }}>
                      Global Listings Portfolio
                    </h3>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Filter by Vendor Admin:</label>
                        <select
                          value={selectedAdminId}
                          onChange={(e) => setSelectedAdminId(e.target.value)}
                          className={styles.select}
                        >
                          <option value="">All Vendors</option>
                          <option value="super_admin">Super Admin</option>
                          {admins.map((adm) => (
                            <option key={adm._id} value={adm._id}>
                              {adm.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setIsAddPropModalOpen(true)}
                        className={styles.submitBtn}
                        style={{ 
                          padding: "0.6rem 1.5rem", 
                          fontSize: "0.8rem", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem" 
                        }}
                      >
                        <PlusCircle size={16} />
                        <span>Add Property</span>
                      </button>
                    </div>
                  </div>

                  {properties.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Ref ID</th>
                            <th>Image</th>
                            <th>Title</th>
                            <th>Location</th>
                            <th>Price</th>
                            <th>Vendor</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties.map((prop) => {
                            const formattedVal = new Intl.NumberFormat("en-IN", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }).format(prop.price);

                            return (
                              <tr key={prop._id}>
                                <td style={{ fontWeight: 600 }}>#{prop.propertyId}</td>
                                <td>
                                  <img
                                    src={getImageUrl(prop.images[0])}
                                    alt="thumb"
                                    style={{ width: "60px", height: "40px", objectFit: "contain", backgroundColor: "#FCFBFA", border: "1px solid var(--color-border)" }}
                                  />
                                </td>
                                <td style={{ fontWeight: 500 }}>{prop.title}</td>
                                <td>{prop.location}</td>
                                <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>{formattedVal}</td>
                                <td style={{ fontWeight: 500 }}>{prop.addedByName}</td>
                                <td>
                                  <span style={{ fontWeight: 600, color: prop.status === "available" ? "#4eb570" : "#888" }}>
                                    {prop.status === "available" ? "Available" : "Sold"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                      onClick={() => handleToggleSoldProperty(prop._id, prop.title, prop.status)}
                                      className={styles.actionBtn}
                                      style={{ color: "var(--color-primary-dark)", textDecoration: "none", border: "1px solid var(--color-border)", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
                                    >
                                      {prop.status === "available" ? "Mark Sold" : "Mark Available"}
                                    </button>
                                    <Link href={`/properties/${prop._id}`} className={`${styles.actionBtn} ${styles.viewBtn}`} style={{ textDecoration: "none", border: "1px solid var(--color-border)", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>
                                      View
                                    </Link>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyMsg}>No property listings found.</div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add Property Modal (Super Admin) */}
      {isAddPropModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddPropModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setIsAddPropModalOpen(false)}
              aria-label="Close Add Property Modal"
            >
              <X size={20} />
            </button>

            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 400, marginBottom: "2rem" }}>
              Register Residence Listing (Super Admin)
            </h2>
            <form onSubmit={handleAddPropertySubmit}>
              {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
              {successMsg && <div className={styles.successBox}>{successMsg}</div>}

              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Property Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Modern Brutalist Oasis"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Location Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 Pinecrest Lane, New York"
                    value={propLocation}
                    onChange={(e) => setPropLocation(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Advisory Price (INR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000000"
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Property Type *</label>
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className={styles.select}
                    style={{ border: "1px solid var(--color-border)", padding: "0.8rem 1rem", fontSize: "0.9rem" }}
                  >
                    <option value="Villa">Villa</option>
                    <option value="Chalet">Chalet</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Bedrooms *</label>
                  <input
                    type="number"
                    placeholder="e.g. 4"
                    value={propBeds}
                    onChange={(e) => setPropBeds(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Bathrooms *</label>
                  <input
                    type="number"
                    placeholder="e.g. 3.5"
                    step="0.5"
                    value={propBaths}
                    onChange={(e) => setPropBaths(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Area size *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5,400 sqft"
                    value={propArea}
                    onChange={(e) => setPropArea(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload Local Images (max 6)</label>
                  <input
                    type="file"
                    id="superImageFiles"
                    multiple
                    accept="image/*"
                    onChange={(e) => setPropSelectedFiles(e.target.files)}
                    className={styles.input}
                    style={{ padding: "0.6rem" }}
                  />
                  <span className={styles.helperText}>Select multiple image files to upload to the server.</span>
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Or Provide Remote Image URLs (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. https://domain.com/img1.jpg, https://domain.com/img2.jpg"
                    value={propImageUrls}
                    onChange={(e) => setPropImageUrls(e.target.value)}
                    className={styles.input}
                  />
                  <span className={styles.helperText}>You can mix both file uploads and image URLs.</span>
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Architectural Description *</label>
                  <textarea
                    placeholder="Write a professional description detailing the structural design, materials, and highlights of the property."
                    value={propDescription}
                    onChange={(e) => setPropDescription(e.target.value)}
                    className={styles.textarea}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={propAddLoading}>
                {propAddLoading ? "Saving Property..." : "Submit Property Listing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
