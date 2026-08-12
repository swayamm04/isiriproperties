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
  LayoutDashboard,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  ChevronLeft
} from "lucide-react";
import { Loader2, Plus, Edit, Trash2, LayoutGrid, CheckCircle2, Copy } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Loader from "@/components/Loader";
import CustomSelect from "@/components/CustomSelect";
import AutocompleteInput from "@/components/AutocompleteInput";
import { formatIndianPrice } from "@/utils/formatPrice";
import styles from "./page.module.css";

interface CategoryField {
  name: string;
  type: "text" | "number";
  unit?: string;
}

interface Category {
  _id: string;
  name: string;
  fields: CategoryField[];
}

interface Property {
  _id: string;
  propertyId: string;
  title: string;
  city?: string;
  location: string;
  price: number;
  images: string[];
  type: string;
  status: "available" | "sold";
  customFields?: Record<string, any>;
  listingType?: string;
  rentFrequency?: string;
  description?: string;
  beds?: number;
  baths?: number;
  area?: string;
}

export default function AdminDashboardPage() {
  const { user, loading, logout, updatePhone } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my_properties" | "settings">("my_properties");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);

  // My properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertiesError, setPropertiesError] = useState("");
  const [propertyListingFilter, setPropertyListingFilter] = useState("All");
  const [viewStatus, setViewStatus] = useState<"available" | "sold">("available");
  const [confirmStatusModal, setConfirmStatusModal] = useState<{ isOpen: boolean, property: Property | null }>({ isOpen: false, property: null });
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{ isOpen: boolean, property: Property | null }>({ isOpen: false, property: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Add Property form state
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [propType, setPropType] = useState("");
  const [propListingType, setPropListingType] = useState("Sell");
  const [propIsPremium, setPropIsPremium] = useState(false);
  const [description, setDescription] = useState("");
  const [propCustomFields, setPropCustomFields] = useState<Record<string, any>>({});
  const [rentFrequency, setRentFrequency] = useState("Month");
  const [customRentFrequency, setCustomRentFrequency] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setImagePreviews([]);
      return;
    }
    const previews: string[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      previews.push(URL.createObjectURL(selectedFiles[i]));
    }
    setImagePreviews(previews);

    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Password settings state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  // Phone settings state
  const [phoneCurrentPassword, setPhoneCurrentPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [expandedSetting, setExpandedSetting] = useState<"password" | "phone" | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  // Fetch admin's properties
  const fetchMyProperties = async () => {
    try {
      setPropertiesLoading(true);
      setPropertiesError("");
      const [propData, catData, cityData] = await Promise.all([
        apiRequest("/properties/admin/my-list"),
        apiRequest("/categories"),
        apiRequest("/properties/cities/all")
      ]);
      setProperties(propData);
      setCategories(catData);
      setCitySuggestions(cityData);
    } catch (err: any) {
      console.error(err);
      setPropertiesError(err.message || "Failed to load properties and categories.");
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

    if (!title || !city || !location || !price || !propType || !description) {
      setAddError("Please fill out all required fields.");
      setAddLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("city", city);
      formData.append("location", location);
      formData.append("price", price);
      formData.append("type", propType);
      formData.append("listingType", propListingType);
      formData.append("isPremium", String(propIsPremium));
      formData.append("description", description);
      formData.append("customFields", JSON.stringify(propCustomFields));
      
      if (propListingType === "Rent") {
        const finalFreq = rentFrequency === "Other" ? customRentFrequency : rentFrequency;
        if (finalFreq) formData.append("rentFrequency", finalFreq);
      }

      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("imageFiles", selectedFiles[i]);
        }
      }

      if (removedImages.length > 0) {
        formData.append("removedImages", removedImages.join(","));
      }

      let url = "/properties";
      let method = "POST";
      
      if (editMode && editingPropertyId) {
        url = `/properties/${editingPropertyId}`;
        method = "PUT";
      }

      await apiRequest(url, {
        method: method,
        body: formData,
      });

      setAddSuccess(editMode ? "Property updated successfully!" : "Property added successfully!");
      setTitle("");
      setCity("");
      setLocation("");
      setPrice("");
      setPropType("");
      setPropListingType("Sell");
      setRentFrequency("Month");
      setCustomRentFrequency("");
      setPropIsPremium(false);
      setPropCustomFields({});
      setDescription("");
      setSelectedFiles([]);
      setExistingImages([]);
      setRemovedImages([]);
      setEditMode(false);
      setEditingPropertyId(null);
      
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

  const handleDeleteProperty = async () => {
    if (!confirmDeleteModal.property) return;
    try {
      setDeleteLoading(true);
      await apiRequest(`/properties/${confirmDeleteModal.property._id}`, {
        method: "DELETE",
      });
      setConfirmDeleteModal({ isOpen: false, property: null });
      fetchMyProperties();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete property");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditClick = async (prop: Property) => {
    try {
      const fullProp = await apiRequest(`/properties/${prop._id}`);
      setEditMode(true);
      setEditingPropertyId(prop._id);
      setTitle(fullProp.title || "");
      setCity(fullProp.city || "");
      setLocation(fullProp.location || "");
      setPrice(fullProp.price?.toString() || "");
      setPropType(fullProp.type || "");
      setPropListingType(fullProp.listingType || "Sell");
      if (fullProp.listingType === "Rent" && fullProp.rentFrequency) {
        if (["Month", "6-months", "Year"].includes(fullProp.rentFrequency)) {
          setRentFrequency(fullProp.rentFrequency);
          setCustomRentFrequency("");
        } else {
          setRentFrequency("Other");
          setCustomRentFrequency(fullProp.rentFrequency);
        }
      } else {
        setRentFrequency("Month");
        setCustomRentFrequency("");
      }
      setPropIsPremium(fullProp.isPremium || false);
      setDescription(fullProp.description || "");
      setPropCustomFields(fullProp.customFields || {});
      setExistingImages(fullProp.images || []);
      setRemovedImages([]);
      setSelectedFiles([]);
      setIsAddPropModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch full property details for edit", err);
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

  const handleChangePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneLoading(true);
    setPhoneError("");
    setPhoneSuccess("");

    if (!phoneCurrentPassword || !newPhone) {
      setPhoneError("Both fields are required.");
      setPhoneLoading(false);
      return;
    }

    if (updatePhone) {
      const success = await updatePhone(newPhone, phoneCurrentPassword);
      if (success) {
        setPhoneSuccess("Phone number updated successfully!");
        setPhoneCurrentPassword("");
        setNewPhone("");
      } else {
        setPhoneError("Failed to update phone number. Please check your password.");
      }
    }
    setPhoneLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <Loader />
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
          <Image src="/logo.png" alt="Isiri Properties" width={160} height={50} style={{ objectFit: "contain", height: "auto" }} />
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

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(76, 131, 161, 0.1)", paddingTop: "1rem" }}>
            <Link href="/" className={`${styles.menuItem} ${styles.hideOnMobile}`}>
              <ExternalLink size={18} strokeWidth={1.5} />
              <span>Return to site</span>
            </Link>

            <button 
              onClick={() => {
                logout();
                window.location.href = "/";
              }} 
              className={`${styles.menuItem} ${styles.hideOnMobile}`}
              style={{ width: "100%" }}
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span>Logout</span>
            </button>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          © {new Date().getFullYear()} Isiri Properties
        </div>
        <button 
          className={styles.sidebarCloseBtn}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close Sidebar"
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
        </button>
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
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
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
                  onClick={() => {
                    setEditMode(false);
                    setEditingPropertyId(null);
                    setTitle("");
                    setCity("");
                    setLocation("");
                    setPrice("");
                    setPropType("");
                    setPropListingType("Sell");
                    setRentFrequency("Month");
                    setCustomRentFrequency("");
                    setPropIsPremium(false);
                    setDescription("");
                    setPropCustomFields({});
                    setSelectedFiles([]);
                    setExistingImages([]);
                    setRemovedImages([]);
                    setIsAddPropModalOpen(true);
                  }}
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
              {/* Toggle between Available and Sold Out */}
              <div className={styles.tabsContainer}>
                <button
                  onClick={() => setViewStatus("available")}
                  className={`${styles.tabBtn} ${viewStatus === "available" ? styles.activeTab : ""}`}
                >
                  Available Portfolio
                </button>
                <button
                  onClick={() => setViewStatus("sold")}
                  className={`${styles.tabBtn} ${viewStatus === "sold" ? styles.activeTab : ""}`}
                >
                  Sold Out Section
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--color-dark-muted)', fontWeight: 500 }}>Listing Type:</label>
                  <CustomSelect
                    options={[
                      { value: "All", label: "All" },
                      { value: "Rent", label: "Rent" },
                      { value: "Sell", label: "Sell" }
                    ]}
                    value={propertyListingFilter}
                    onChange={(val) => setPropertyListingFilter(val)}
                    style={{ minWidth: "120px", padding: 0, border: 'none' }}
                  />
                </div>
              </div>

              {propertiesError && <div className={styles.errorBox}>{propertiesError}</div>}
              
              {propertiesLoading ? (
                <Loader />
              ) : properties.filter(p => p.status === viewStatus && (propertyListingFilter === "All" || (p.listingType || "Sell").toLowerCase() === propertyListingFilter.toLowerCase())).length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Ref ID</th>
                        <th>Image</th>
                        <th>Title</th>
                        <th>City</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Type</th>
                        <th>Specs</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.filter(p => p.status === viewStatus && (propertyListingFilter === "All" || (p.listingType || "Sell").toLowerCase() === propertyListingFilter.toLowerCase())).map((prop) => {
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
                            <td>{prop.city || "N/A"}</td>
                            <td>{prop.location}</td>
                            <td style={{ color: "var(--color-primary-dark)", fontWeight: 600 }}>
                              {formatIndianPrice(prop.price)}
                              {prop.listingType === "Rent" && prop.rentFrequency && (
                                <span style={{ fontSize: "0.7em", marginLeft: "4px", color: "var(--color-dark-muted)", fontWeight: 500 }}>
                                  / {prop.rentFrequency}
                                </span>
                              )}
                            </td>
                            <td>{prop.type}</td>
                            <td style={{ fontSize: "0.8rem", color: "var(--color-dark-muted)" }}>
                              {prop.customFields && Object.keys(prop.customFields).length > 0
                                ? Object.entries(prop.customFields).map(([k, v]) => `${k}: ${v}`).join(" | ")
                                : "No custom specs"}
                            </td>
                            <td>
                              <span className={prop.status === "available" ? styles.statusAvailable : styles.statusSold}>
                                {prop.status === "available" ? "Available" : "Sold"}
                              </span>
                            </td>
                            <td style={{ position: "relative" }}>
                              <button 
                                onClick={() => setOpenMenuId(openMenuId === prop._id ? null : prop._id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-dark)' }}
                                aria-label="More actions"
                              >
                                <MoreVertical size={20} />
                              </button>
                              
                              {openMenuId === prop._id && (
                                <div style={{
                                  position: 'absolute',
                                  right: '0',
                                  top: '100%',
                                  background: 'white',
                                  border: '1px solid var(--color-border)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  borderRadius: '6px',
                                  padding: '0.25rem 0',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  zIndex: 50,
                                  minWidth: '130px'
                                }}>
                                  <button 
                                    onClick={() => {
                                      setConfirmStatusModal({ isOpen: true, property: prop });
                                      setOpenMenuId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--color-dark)', width: '100%' }}
                                  >
                                    {prop.status === "available" ? "Mark as Sold" : "Mark as Available"}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      handleEditClick(prop);
                                      setOpenMenuId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--color-dark)', width: '100%' }}
                                  >
                                    Edit Property
                                  </button>
                                  <Link 
                                    href={`/properties/${prop._id}`} 
                                    style={{ textDecoration: 'none', color: 'var(--color-dark)', padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'block', width: '100%' }}
                                  >
                                    View Details
                                  </Link>
                                  <button 
                                    onClick={() => {
                                      setConfirmDeleteModal({ isOpen: true, property: prop });
                                      setOpenMenuId(null);
                                    }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#e05e5e', width: '100%' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyMsg}>
                  <p>You do not have any properties listed under the {viewStatus === "available" ? "Available" : "Sold Out"} section.</p>
                </div>
              )}
            </div>
          )}


        </main>
      </div>

      {openMenuId && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9 }}
          onClick={() => setOpenMenuId(null)}
        />
      )}

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
              {editMode ? "Edit Residence Listing" : "Register Residence Listing"}
            </h2>
            <form onSubmit={handleAddPropertySubmit}>
              {/* Listing Type Toggle at the Top */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setPropListingType("Sell")}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: propListingType === "Sell" ? 'var(--color-primary)' : 'transparent',
                    color: propListingType === "Sell" ? 'white' : 'var(--color-dark)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Sell
                </button>
                <button
                  type="button"
                  onClick={() => setPropListingType("Rent")}
                  style={{
                    flex: 1,
                    padding: '0.8rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: propListingType === "Rent" ? 'var(--color-primary)' : 'transparent',
                    color: propListingType === "Rent" ? 'white' : 'var(--color-dark)',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Rent
                </button>
              </div>

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
                  <label className={styles.label}>City *</label>
                  <AutocompleteInput
                    value={city}
                    onChange={(val) => setCity(val)}
                    options={citySuggestions}
                    placeholder="e.g. New York"
                    required={true}
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
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <input
                      type="number"
                      placeholder="e.g. 45000000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      className={styles.input}
                      required
                      style={{ flex: 1 }}
                    />
                    {propListingType === "Rent" && (
                      <select 
                        value={rentFrequency} 
                        onChange={(e) => setRentFrequency(e.target.value)}
                        className={styles.input}
                        style={{ width: '120px', padding: '0.75rem' }}
                      >
                        <option value="Month">/ Month</option>
                        <option value="6-months">/ 6-months</option>
                        <option value="Year">/ Year</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>
                  {propListingType === "Rent" && rentFrequency === "Other" && (
                    <input
                      type="text"
                      placeholder="e.g. Week or 15 Days"
                      value={customRentFrequency}
                      onChange={(e) => setCustomRentFrequency(e.target.value)}
                      className={styles.input}
                      style={{ marginTop: '0.5rem' }}
                      required
                    />
                  )}
                  {price && (
                    <span className={styles.helperText} style={{ marginTop: '0.4rem', display: 'block', color: 'var(--color-primary-dark)', fontWeight: 500 }}>
                      {formatIndianPrice(Number(price))}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Property Type *</label>
                  <CustomSelect
                    options={
                      categories.filter((c: any) => (c.listingType || "Sell") === propListingType).length > 0 
                        ? categories.filter((c: any) => (c.listingType || "Sell") === propListingType).map(c => ({ value: c.name, label: c.name }))
                        : []
                    }
                    value={propType}
                    onChange={(val) => {
                      setPropType(val);
                      setPropCustomFields({});
                    }}
                    placeholder="Select Property Type"
                  />
                </div>



                {/* Custom Fields Rendering */}
                {categories.find(c => c.name === propType)?.fields.map(field => (
                  <div key={field.name} className={styles.formGroup}>
                    <label className={styles.label}>{field.name} {field.unit ? `(${field.unit})` : ""}</label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      placeholder={`Enter ${field.name}`}
                      value={propCustomFields[field.name] || ""}
                      onChange={(e) => setPropCustomFields({...propCustomFields, [field.name]: e.target.value})}
                      className={styles.input}
                    />
                  </div>
                ))}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Upload Local Images (max 6)</label>
                  <input
                    type="file"
                    id="imageFiles"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        let validFiles = Array.from(e.target.files).filter(file => file.size <= 3 * 1024 * 1024);
                        if (validFiles.length !== e.target.files.length) {
                          alert("Some files exceed the 3MB limit and were removed.");
                        }
                        setSelectedFiles(prev => {
                          const currentTotal = existingImages.length + prev.length;
                          if (currentTotal >= 6) {
                            alert("You can only upload a maximum of 6 images.");
                            return prev;
                          }
                          const allowedSpaces = 6 - currentTotal;
                          if (validFiles.length > allowedSpaces) {
                            alert(`You can only add ${allowedSpaces} more image(s). Extra images were discarded.`);
                            validFiles = validFiles.slice(0, allowedSpaces);
                          }
                          return [...prev, ...validFiles];
                        });
                      }
                      e.target.value = "";
                    }}
                    disabled={existingImages.length + selectedFiles.length >= 6}
                    className={styles.input}
                    style={{ padding: "0.6rem" }}
                  />
                  <span className={styles.helperText} style={{ display: 'block', marginTop: '0.2rem' }}>Select multiple image files (Max 3MB per file).</span>

                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {existingImages.map((src, index) => (
                        <div key={`existing-${index}`} style={{ position: 'relative' }}>
                          <img 
                            src={getImageUrl(src)} 
                            alt={`Existing ${index}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setExistingImages(prev => prev.filter((_, i) => i !== index));
                              setRemovedImages(prev => [...prev, src]);
                            }}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e05e5e', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {imagePreviews.map((src, index) => (
                        <div key={`new-${index}`} style={{ position: 'relative' }}>
                          <img 
                            src={src} 
                            alt={`New ${index}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                            }}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e05e5e', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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

              {addError && <div className={styles.errorBox} style={{ marginBottom: '1rem' }}>{addError}</div>}
              {addSuccess && <div className={styles.successBox} style={{ marginBottom: '1rem' }}>{addSuccess}</div>}
              <button type="submit" className={styles.submitBtn} disabled={addLoading}>
                {addLoading ? (editMode ? "Updating Property..." : "Saving Property...") : (editMode ? "Update Property Listing" : "Submit Property Listing")}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Custom Confirm Status Modal */}
      {confirmStatusModal.isOpen && confirmStatusModal.property && (
        <div className={styles.modalOverlay} onClick={() => !statusUpdateLoading && setConfirmStatusModal({ isOpen: false, property: null })}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1rem", color: "var(--color-dark)" }}>Confirm Status Change</h3>
            <p style={{ color: "var(--color-dark-muted)", marginBottom: "2rem", lineHeight: "1.5" }}>
              Are you sure you want to change the status of <strong>{confirmStatusModal.property.title}</strong> to <strong>{confirmStatusModal.property.status === "available" ? "Sold Out" : "Available"}</strong>?
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setConfirmStatusModal({ isOpen: false, property: null })}
                disabled={statusUpdateLoading}
                className={styles.submitBtn}
                style={{ backgroundColor: 'transparent', color: 'var(--color-dark)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (!confirmStatusModal.property) return;
                  try {
                    setStatusUpdateLoading(true);
                    await apiRequest(`/properties/admin/sold/${confirmStatusModal.property._id}`, { method: 'PUT' });
                    fetchMyProperties();
                    setConfirmStatusModal({ isOpen: false, property: null });
                  } catch (err: any) {
                    alert(err.message || "Failed to update status");
                  } finally {
                    setStatusUpdateLoading(false);
                  }
                }}
                disabled={statusUpdateLoading}
                className={styles.submitBtn}
              >
                {statusUpdateLoading ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      {confirmDeleteModal.isOpen && confirmDeleteModal.property && (
        <div className={styles.modalOverlay} onClick={() => !deleteLoading && setConfirmDeleteModal({ isOpen: false, property: null })}>
          <div className={styles.modalContent} style={{ maxWidth: '450px', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1rem", color: "var(--color-dark)" }}>Confirm Delete</h3>
            <p style={{ color: "var(--color-dark-muted)", marginBottom: "2rem", lineHeight: "1.5" }}>
              Are you sure you want to delete <strong>{confirmDeleteModal.property.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setConfirmDeleteModal({ isOpen: false, property: null })}
                disabled={deleteLoading}
                className={styles.submitBtn}
                style={{ backgroundColor: 'transparent', color: 'var(--color-dark)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteProperty}
                disabled={deleteLoading}
                className={styles.submitBtn}
                style={{ backgroundColor: '#e05e5e' }}
              >
                {deleteLoading ? "Deleting..." : "Delete Property"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
