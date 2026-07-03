"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { apiRequest, getImageUrl } from "@/utils/api";
import { 
  Building2, 
  Home, 
  PlusCircle, 
  Settings, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard 
} from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

interface Property {
  _id: string;
  propertyId: string;
  title: string;
  location: string;
  price: number;
  images: string[];
  beds: number;
  baths: number;
  area: string;
  type: string;
  status: "available" | "sold";
}

export default function AdminDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my_properties" | "settings">("my_properties");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);

  // My properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState("");

  // Add Property form state
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Villa");
  const [beds, setBeds] = useState("3");
  const [baths, setBaths] = useState("2.5");
  const [area, setArea] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [imageUrls, setImageUrls] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");
  const [addError, setAddError] = useState("");

  // Password settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // Fetch admin's properties
  const fetchMyProperties = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError("");
      const data = await apiRequest("/properties/admin/my-list");
      setProperties(data);
    } catch (err: any) {
      console.error(err);
      setPropertiesError(err.message || "Failed to load properties.");
    } finally {
      setPropertiesLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "admin") {
      router.push("/");
      return;
    }
    
    if (activeTab === "my_properties") {
      fetchMyProperties();
    }
  }, [user, loading, activeTab]);

  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");

    if (!title || !location || !price || !area || !description) {
      setAddError("Please fill out all required fields.");
      setAddLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("location", location);
      formData.append("price", price);
      formData.append("type", type);
      formData.append("beds", beds);
      formData.append("baths", baths);
      formData.append("area", area);
      formData.append("description", description);
      formData.append("imageUrls", imageUrls);

      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("imageFiles", selectedFiles[i]);
        }
      }

      await apiRequest("/properties", {
        method: "POST",
        body: formData,
      });

      setAddSuccess("Property added successfully!");
      setTitle("");
      setLocation("");
      setPrice("");
      setType("Villa");
      setBeds("3");
      setBaths("2.5");
      setArea("");
      setDescription("");
      setSelectedFiles(null);
      setImageUrls("");
      
      const fileInput = document.getElementById("imageFiles") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh listings in background
      fetchMyProperties();

      // Close modal after delay
      setTimeout(() => {
        setIsAddPropModalOpen(false);
        setAddSuccess("");
      }, 2000);
    } catch (err: any) {
      setAddError(err.message || "Failed to add property.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("All password fields are required.");
      setPassLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      setPassLoading(false);
      return;
    }

    try {
      await apiRequest("/admin/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setPassSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", color: "var(--color-primary)" }}>
          Loading Admin Workspace...
        </p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <p style={{ color: "#e05e5e" }}>Access Denied. Admin permissions required.</p>
      </div>
    );
  }

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "my_properties": return "Portfolio / My Properties";
      case "settings": return "Settings / Password Profile";
      default: return "Portfolio";
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
              setActiveTab("my_properties");
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "my_properties" ? styles.activeMenuItem : ""}`}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} />
            <span>My Properties</span>
          </button>

          <button
            onClick={() => {
              setIsAddPropModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className={styles.menuItem}
          >
            <PlusCircle size={18} strokeWidth={1.5} />
            <span>Add Property</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("settings");
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "settings" ? styles.activeMenuItem : ""}`}
          >
            <Settings size={18} strokeWidth={1.5} />
            <span>Settings</span>
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
            Architect Panel <span className={styles.breadcrumbCurrent}>/ {getBreadcrumbTitle()}</span>
          </div>

          <div className={styles.profileArea}>
            <div className={styles.profileText}>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileRole}>Vendor Admin</div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h1 className={styles.title}>
                  {activeTab === "my_properties" ? "My Properties Portfolio" : "Vendor Account Profile"}
                </h1>
                <p className={styles.subtitle}>
                  Welcome back, {user.name.split(" ")[0]}. Manage and coordinate your assigned listings.
                </p>
              </div>
              
              {activeTab === "my_properties" && (
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
              )}
            </div>
          </div>

          {/* Active Tab Content */}
          {activeTab === "my_properties" && (
            <div>
              {propertiesError && <div className={styles.errorBox}>{propertiesError}</div>}
              
              {propertiesLoading ? (
                <p style={{ textAlign: "center", padding: "3rem", color: "var(--color-dark-muted)" }}>Loading properties list...</p>
              ) : properties.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ref ID</th>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Type</th>
                        <th>Specs</th>
                        <th>Status</th>
                        <th>Action</th>
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
                                className={styles.propThumb}
                              />
                            </td>
                            <td style={{ fontWeight: 500 }}>{prop.title}</td>
                            <td>{prop.location}</td>
                            <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>{formattedVal}</td>
                            <td>{prop.type}</td>
                            <td style={{ fontSize: "0.8rem", color: "var(--color-dark-muted)" }}>
                              {prop.beds} Beds | {prop.baths} Baths | {prop.area}
                            </td>
                            <td>
                              <span className={prop.status === "available" ? styles.statusAvailable : styles.statusSold}>
                                {prop.status === "available" ? "Available" : "Sold"}
                              </span>
                            </td>
                            <td>
                              <Link href={`/properties/${prop._id}`} className={styles.viewBtn}>
                                View Page
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyMsg}>
                  <p>You have not added any properties yet. Click "Add Property" to begin listing.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className={styles.formBox} style={{ maxWidth: "550px" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 400, marginBottom: "2rem" }}>
                Change Password
              </h2>
              <form onSubmit={handleChangePasswordSubmit}>
                {passError && <div className={styles.errorBox}>{passError}</div>}
                {passSuccess && <div className={styles.successBox}>{passSuccess}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Current Password *</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>New Password *</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Confirm New Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={passLoading}>
                  {passLoading ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Add Property Modal */}
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
              Register Residence Listing
            </h2>
            <form onSubmit={handleAddPropertySubmit}>
              {addError && <div className={styles.errorBox}>{addError}</div>}
              {addSuccess && <div className={styles.successBox}>{addSuccess}</div>}

              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Property Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Modern Brutalist Oasis"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Location Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. 45 Pinecrest Lane, New York"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Advisory Price (INR) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 45000000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Property Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
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
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
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
                    value={baths}
                    onChange={(e) => setBaths(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Area size *</label>
                  <input
                    type="text"
                    placeholder="e.g. 5,400 sqft"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload Local Images (max 6)</label>
                  <input
                    type="file"
                    id="imageFiles"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(e.target.files)}
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
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    className={styles.input}
                  />
                  <span className={styles.helperText}>You can mix both file uploads and image URLs.</span>
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Architectural Description *</label>
                  <textarea
                    placeholder="Write a professional description detailing the structural design, materials, and highlights of the property."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={styles.textarea}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={addLoading}>
                {addLoading ? "Saving Property..." : "Submit Property Listing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
