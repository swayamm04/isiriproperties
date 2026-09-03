"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  MoreVertical,
  UserCog,
  ClipboardList,
  Download
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Loader from '@/components/Loader';
import CustomSelect from '@/components/CustomSelect';
import AutocompleteInput from '@/components/AutocompleteInput';
import { getIconForField } from '@/utils/iconMap';
import { formatIndianPrice } from "@/utils/formatPrice";
import styles from "./page.module.css";
import imageCompression from "browser-image-compression";

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
  phone?: string;
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
  city?: string;
  location: string;
  price: number;
  images: string[];
  type: string;
  addedBy: string;
  addedByName: string;
  status: "available" | "sold";
  listingType?: string;
  rentFrequency?: string;
  isPremium?: boolean;
  description?: string;
  customFields?: Record<string, any>;
  keyPoints?: string[];
  amenities?: string[];
}

interface CategoryField {
  name: string;
  type: string;
  unit?: string;
}

interface Category {
  _id: string;
  name: string;
  fields: CategoryField[];
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

interface ActivityLog {
  _id: string;
  user: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function SuperAdminDashboardPage() {
  const { user, loading, logout, updatePhone } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"dashboard" | "inquiries" | "admins" | "employees" | "users" | "properties" | "settings" | "activity_logs">("dashboard");
  const [selectedInquiry, setSelectedInquiry] = useState<InterestInquiry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [logoClicks, setLogoClicks] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  // State values
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquiries, setInquiries] = useState<InterestInquiry[]>([]);
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [employees, setEmployees] = useState<AdminProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  
  // Activity Logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");
  const [logRoleFilter, setLogRoleFilter] = useState("All");
  const [logUserFilter, setLogUserFilter] = useState("");
  const [roleUsers, setRoleUsers] = useState<{_id: string, name: string}[]>([]);
  const [fetchingRoleUsers, setFetchingRoleUsers] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Loading & Error states
  const [statsLoading, setStatsLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add/Edit Admin form state
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminProfileImage, setAdminProfileImage] = useState<File | null>(null);
  const [addAdminLoading, setAddAdminLoading] = useState(false);

  // Add Property form state
  const [propTitle, setPropTitle] = useState("");
  const [propCity, setPropCity] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [propPrice, setPropPrice] = useState("");
  const [propType, setPropType] = useState("");
  const [propListingType, setPropListingType] = useState("Sell");
  const [propIsPremium, setPropIsPremium] = useState(false);
  const [propDescription, setPropDescription] = useState("");
  const [propSelectedFiles, setPropSelectedFiles] = useState<File[]>([]);
  const [propAddLoading, setPropAddLoading] = useState(false);
  const [propCustomFields, setPropCustomFields] = useState<Record<string, any>>({});
  const [propRentFrequency, setPropRentFrequency] = useState("Month");
  const [propCustomRentFrequency, setPropCustomRentFrequency] = useState("");
  const [propEditMode, setPropEditMode] = useState(false);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [propExistingImages, setPropExistingImages] = useState<string[]>([]);
  const [propRemovedImages, setPropRemovedImages] = useState<string[]>([]);
  const [propImagePreviews, setPropImagePreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [keyPointInput, setKeyPointInput] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  
  const [openPropertyMenuId, setOpenPropertyMenuId] = useState<string | null>(null);
  const [propConfirmStatusModal, setPropConfirmStatusModal] = useState<{isOpen: boolean, property: Property | null}>({ isOpen: false, property: null });
  const [propStatusUpdateLoading, setPropStatusUpdateLoading] = useState(false);
  const [propConfirmDeleteModal, setPropConfirmDeleteModal] = useState<{isOpen: boolean, property: Property | null}>({ isOpen: false, property: null });
  const [propDeleteLoading, setPropDeleteLoading] = useState(false);

  // Category form state
  const [catName, setCatName] = useState("");
  const [catListingType, setCatListingType] = useState("Sell");
  const [catFields, setCatFields] = useState<CategoryField[]>([]);
  const [catAddLoading, setCatAddLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Property filtering state
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [propertyListingFilter, setPropertyListingFilter] = useState("All");

  // Settings form state
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState("");
  const [settingsNewPassword, setSettingsNewPassword] = useState("");
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState("");
  const [settingsUpdateLoading, setSettingsUpdateLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Phone settings state
  const [phoneCurrentPassword, setPhoneCurrentPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [expandedSetting, setExpandedSetting] = useState<"password" | "phone" | null>(null);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    setLogoClicks(newClicks);
    
    if (clickTimer) clearTimeout(clickTimer);
    
    const newTimer = setTimeout(() => {
      setLogoClicks(0);
    }, 2000);
    setClickTimer(newTimer);

    if (newClicks >= 5) {
      clearTimeout(newTimer);
      setLogoClicks(0);
      router.push("/super-admin/secret-reset");
    }
  };

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

  const fetchActivityLogs = async () => {
    setLogsLoading(true);
    try {
      let url = `/superadmin/activity-logs?role=${logRoleFilter}`;
      if (logStartDate) url += `&startDate=${logStartDate}`;
      if (logEndDate) url += `&endDate=${logEndDate}`;
      if (logUserFilter) url += `&userId=${logUserFilter}`;
      const data = await apiRequest(url);
      setActivityLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Activity Logs Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    if (logStartDate || logEndDate) {
      doc.text(`Date Range: ${logStartDate || "Any"} to ${logEndDate || "Any"}`, 14, 27);
    }
    
    const tableData = activityLogs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.userRole,
      log.userName,
      log.action,
      log.details || "-"
    ]);
    
    autoTable(doc, {
      head: [["Date & Time", "Role", "User", "Action", "Details"]],
      body: tableData,
      startY: (logStartDate || logEndDate) ? 32 : 27,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 34, 64] }
    });
    
    doc.save("activity_logs_report.pdf");
  };

  const loadTabData = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setTabLoading(true);

    try {
      if (activeTab === "dashboard") {
        await loadStats();
      } else if (activeTab === "inquiries") {
        const data = await apiRequest("/interest");
        setInquiries(data);
      } else if (activeTab === "admins") {
        const data = await apiRequest("/superadmin/admins");
        setAdmins(data);
      } else if (activeTab === "employees") {
        const data = await apiRequest("/superadmin/employees");
        setEmployees(data);
      } else if (activeTab === "users") {
        const data = await apiRequest("/superadmin/users");
        setUsers(data);
      } else if (activeTab === "properties") {
        const endpoint = selectedAdminId 
          ? `/superadmin/properties?adminId=${selectedAdminId}` 
          : "/superadmin/properties";
        const [propData, catData, adminsData, cityData] = await Promise.all([
          apiRequest(endpoint),
          apiRequest("/categories"),
          apiRequest("/superadmin/admins"),
          apiRequest("/properties/cities/all")
        ]);
        setProperties(propData);
        setCategories(catData);
        setAdmins(adminsData);
        setCitySuggestions(cityData);
      } else if (activeTab === "activity_logs") {
        await fetchActivityLogs();
      }
    } catch (err: any) {
      console.error(`Error loading data for ${activeTab}:`, err);
      setErrorMsg(err.message || "Failed to load tab information.");
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    if (!propSelectedFiles || propSelectedFiles.length === 0) {
      setPropImagePreviews([]);
      return;
    }
    const previews: string[] = [];
    for (let i = 0; i < propSelectedFiles.length; i++) {
      previews.push(URL.createObjectURL(propSelectedFiles[i]));
    }
    setPropImagePreviews(previews);

    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [propSelectedFiles]);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== "super_admin" && user.role !== "employee")) {
      router.push("/");
      return;
    }

    loadStats();
  }, [user, loading]);

  useEffect(() => {
    if (loading || !user || (user.role !== "super_admin" && user.role !== "employee")) return;
    loadTabData();
  }, [activeTab, selectedAdminId, user, loading, propertyListingFilter, logStartDate, logEndDate, logRoleFilter, logUserFilter]);

  useEffect(() => {
    if (logRoleFilter === "All") {
      setRoleUsers([]);
      setLogUserFilter("");
      return;
    }
    const fetchUsersForRole = async () => {
      setFetchingRoleUsers(true);
      try {
        const users = await apiRequest(`/superadmin/users-by-role?role=${logRoleFilter}`);
        setRoleUsers(users);
        setLogUserFilter("");
      } catch (err) {
        console.error("Failed to fetch users by role:", err);
      } finally {
        setFetchingRoleUsers(false);
      }
    };
    fetchUsersForRole();
  }, [logRoleFilter]);

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

  // Actions: Add/Edit Admin/Employee Submit
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddAdminLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const formData = new FormData();
      formData.append("name", adminName);
      formData.append("email", adminEmail);
      formData.append("phone", adminPhone);
      if (adminPassword) formData.append("password", adminPassword);
      if (adminProfileImage) formData.append("profileImage", adminProfileImage);
      if (activeTab === "employees") formData.append("role", "employee");

      const endpoint = activeTab === "employees" ? "/superadmin/employees" : "/superadmin/admins";

      if (editingAdminId) {
        await apiRequest(`${endpoint}/${editingAdminId}`, {
          method: "PUT",
          body: formData,
        });
        setSuccessMsg(`Account details updated successfully.`);
        setEditingAdminId(null);
      } else {
        await apiRequest(endpoint, {
          method: "POST",
          body: formData,
        });
        setSuccessMsg(`Account created successfully.`);
      }
      setAdminName("");
      setAdminEmail("");
      setAdminPhone("");
      setAdminPassword("");
      setAdminProfileImage(null);
      setIsAddAdminModalOpen(false);
      loadStats();
      loadTabData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save.");
    } finally {
      setAddAdminLoading(false);
    }
  };

  // Actions: Add Category Submit
  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatAddLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!catName.trim()) {
      setErrorMsg("Category name is required.");
      setCatAddLoading(false);
      return;
    }

    try {
      if (editingCategoryId) {
        await apiRequest(`/categories/${editingCategoryId}`, {
          method: "PUT",
          body: JSON.stringify({ name: catName, fields: catFields, listingType: catListingType }),
        });
        setSuccessMsg("Property Type updated successfully!");
        setEditingCategoryId(null);
      } else {
        await apiRequest("/categories", {
          method: "POST",
          body: JSON.stringify({ name: catName, fields: catFields, listingType: catListingType }),
        });
        setSuccessMsg("Property Type added successfully!");
      }
      
      setCatName("");
      setCatFields([]);
      
      const newCatData = await apiRequest("/categories");
      setCategories(newCatData);
      
      setTimeout(() => {
        setSuccessMsg("");
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add category.");
    } finally {
      setCatAddLoading(false);
    }
  };

  const handleEditProperty = (property: Property) => {
    setPropTitle(property.title);
    setPropCity(property.city || "");
    setPropLocation(property.location);
    setPropPrice(property.price.toString());
    setPropType(property.type);
    setPropListingType(property.listingType || "Sell");
    if (property.listingType === "Rent" && property.rentFrequency) {
      if (["Month", "6-months", "Year"].includes(property.rentFrequency)) {
        setPropRentFrequency(property.rentFrequency);
        setPropCustomRentFrequency("");
      } else {
        setPropRentFrequency("Other");
        setPropCustomRentFrequency(property.rentFrequency);
      }
    } else {
      setPropRentFrequency("Month");
      setPropCustomRentFrequency("");
    }
    setPropIsPremium(property.isPremium || false);
    setPropDescription(property.description || "");
    setPropCustomFields(property.customFields || {});
    setPropExistingImages(property.images || []);
    setPropRemovedImages([]);
    setPropSelectedFiles([]);
    setKeyPoints(property.keyPoints || []);
    setAmenities(property.amenities || []);
    setKeyPointInput("");
    setAmenityInput("");
    setPropEditMode(true);
    setEditingPropId(property._id);
    setIsAddPropModalOpen(true);
    setOpenPropertyMenuId(null);
  };

  const handleDeleteProperty = async () => {
    if (!propConfirmDeleteModal.property) return;
    try {
      setPropDeleteLoading(true);
      await apiRequest(`/properties/${propConfirmDeleteModal.property._id}`, {
        method: "DELETE",
      });
      setProperties(properties.filter(p => p._id !== propConfirmDeleteModal.property?._id));
      setPropConfirmDeleteModal({ isOpen: false, property: null });
    } catch (err: any) {
      alert(err.message || "Failed to delete property.");
    } finally {
      setPropDeleteLoading(false);
    }
  };

  const handleStatusUpdateProperty = async () => {
    if (!propConfirmStatusModal.property) return;
    try {
      setPropStatusUpdateLoading(true);
      const newStatus = propConfirmStatusModal.property.status === "available" ? "sold" : "available";
      await apiRequest(`/superadmin/properties/${propConfirmStatusModal.property._id}/sold`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      setProperties(properties.map(p => 
        p._id === propConfirmStatusModal.property?._id ? { ...p, status: newStatus } : p
      ));
      setPropConfirmStatusModal({ isOpen: false, property: null });
    } catch (err: any) {
      alert(err.message || "Failed to update property status.");
    } finally {
      setPropStatusUpdateLoading(false);
    }
  };

  // Actions: Add Property Submit
  const handleAddPropertySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPropAddLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!propTitle || !propCity || !propLocation || !propPrice || !propDescription) {
      setErrorMsg("Please fill out all required fields.");
      setPropAddLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", propTitle);
      formData.append("city", propCity);
      formData.append("location", propLocation);
      formData.append("price", propPrice);
      formData.append("type", propType);
      formData.append("listingType", propListingType);
      formData.append("isPremium", String(propIsPremium));
      formData.append("description", propDescription);
      formData.append("customFields", JSON.stringify(propCustomFields));

      if (propListingType === "Rent") {
        const finalFreq = propRentFrequency === "Other" ? propCustomRentFrequency : propRentFrequency;
        if (finalFreq) formData.append("rentFrequency", finalFreq);
      }

      formData.append("keyPoints", JSON.stringify(keyPoints));
      formData.append("amenities", JSON.stringify(amenities));

      if (propSelectedFiles && propSelectedFiles.length > 0) {
        for (let i = 0; i < propSelectedFiles.length; i++) {
          formData.append("imageFiles", propSelectedFiles[i]);
        }
      }
      if (propRemovedImages.length > 0) {
        formData.append("removedImages", propRemovedImages.join(","));
      }

      let url = "/properties";
      let method = "POST";
      
      if (propEditMode && editingPropId) {
        url = `/properties/${editingPropId}`;
        method = "PUT";
      }

      await apiRequest(url, {
        method: method,
        body: formData,
      });

      setSuccessMsg(propEditMode ? "Property updated successfully!" : "Property added successfully!");
      setPropTitle("");
      setPropCity("");
      setPropLocation("");
      setPropPrice("");
      setPropType("");
      setPropListingType("Sell");
      setPropRentFrequency("Month");
      setPropCustomRentFrequency("");
      setPropIsPremium(false);
      setPropDescription("");
      setPropSelectedFiles([]);
      setPropCustomFields({});
      setPropEditMode(false);
      setEditingPropId(null);
      setSelectedFiles([]);
      setExistingImages([]);
      setRemovedImages([]);
      setKeyPoints([]);
      setAmenities([]);
      setKeyPointInput("");
      setAmenityInput("");
      setPropEditMode(false);

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
    setAdminPhone(adm.phone || "");
    setAdminPassword("");
    setIsAddAdminModalOpen(true);
  };

  const cancelEditAdmin = () => {
    setEditingAdminId(null);
    setAdminName("");
    setAdminEmail("");
    setAdminPhone("");
    setAdminPassword("");
    setAdminProfileImage(null);
    setIsAddAdminModalOpen(false);
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



  // Actions: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsUpdateLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (settingsNewPassword !== settingsConfirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      setSettingsUpdateLoading(false);
      return;
    }

    try {
      await apiRequest("/auth/update-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: settingsCurrentPassword,
          newPassword: settingsNewPassword,
        }),
      });
      setSuccessMsg("Password updated successfully.");
      setSettingsCurrentPassword("");
      setSettingsNewPassword("");
      setSettingsConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setSettingsUpdateLoading(false);
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
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

  if (!user || user.role !== "super_admin") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "var(--color-bg-light)" }}>
        <p style={{ color: "#e05e5e" }}>Access Denied. Super Admin credentials required.</p>
      </div>
    );
  }

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard / General";
      case "inquiries": return "Dashboard / Enquiries";
      case "admins": return "Supervision / Vendor Admins";
      case "employees": return "Supervision / Employees";
      case "users": return "Supervision / Registered Users";
      case "properties": return "Supervision / Global Properties";
      case "activity_logs": return "Supervision / Activity Logs";
      case "settings": return "System / Account Settings";
      default: return "Dashboard";
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Left Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarBrand}>
          <div style={{ display: "flex", alignItems: "center", height: "50px", overflow: "visible" }}>
            <Image 
              src="/logo-v2.png" 
              alt="Plot&Acre" 
              width={280} 
              height={140} 
              className="brand-logo-image" 
              style={{ cursor: "pointer" }}
              onClick={handleLogoClick}
            />
          </div>
        </div>

        <nav className={styles.sidebarMenu}>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              cancelEditAdmin();
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "dashboard" ? styles.activeMenuItem : ""}`}
          >
            <LayoutDashboard size={18} strokeWidth={1.5} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("inquiries");
              cancelEditAdmin();
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "inquiries" ? styles.activeMenuItem : ""}`}
          >
            <MessageSquare size={18} strokeWidth={1.5} />
            <span>Enquiries</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("admins");
              setIsSidebarOpen(false);
            }}
            className={`${styles.menuItem} ${activeTab === "admins" ? styles.activeMenuItem : ""}`}
          >
            <Shield size={18} strokeWidth={1.5} />
            <span>Manage Vendors</span>
          </button>

          {user?.role === "super_admin" && (
            <button
              onClick={() => {
                setActiveTab("employees");
                setIsSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === "employees" ? styles.activeMenuItem : ""}`}
            >
              <UserCog size={18} strokeWidth={1.5} />
              <span>Manage Employees</span>
            </button>
          )}

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

          {user?.role === "super_admin" && (
            <button
              onClick={() => {
                setActiveTab("activity_logs");
                cancelEditAdmin();
                setIsSidebarOpen(false);
              }}
              className={`${styles.menuItem} ${activeTab === "activity_logs" ? styles.activeMenuItem : ""}`}
            >
              <ClipboardList size={18} strokeWidth={1.5} />
              <span>Activity Logs</span>
            </button>
          )}

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
          © {new Date().getFullYear()} Plot&Acre
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
            System <span className={styles.breadcrumbCurrent}>/ {getBreadcrumbTitle()}</span>
          </div>

          <div className={styles.profileArea}>
            <div className={styles.profileText}>
              <div className={styles.profileName}>{user.name}</div>
              <div className={styles.profileRole}>Super Admin</div>
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
            <h1 className={styles.title}>
              {activeTab === "dashboard" ? "System Dashboard" : activeTab === "inquiries" ? "Client Enquiries" : activeTab === "admins" ? "Manage Vendor Admins" : activeTab === "employees" ? "Manage Employees" : activeTab === "users" ? "Manage Customer Users" : activeTab === "activity_logs" ? "Activity Logs" : activeTab === "settings" ? "Account Settings" : "Global Property Listings"}
            </h1>
            <p className={styles.subtitle}>
              Welcome back, {user.name.split(" ")[0]}. Here is the current status of your real estate platform.
            </p>
          </div>

          {/* Messages */}
          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
          {successMsg && <div className={styles.successBox}>{successMsg}</div>}
          {phoneError && <div className={styles.errorBox}>{phoneError}</div>}
          {phoneSuccess && <div className={styles.successBox}>{phoneSuccess}</div>}

          {/* Tab Render Content */}
          {tabLoading ? (
            <Loader />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <div>
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
                          <div className={styles.statVal}>{stats.availableProperties}</div>
                          <div className={styles.statLabel}>Active Properties</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <Building2 size={20} strokeWidth={1.5} />
                        </div>
                      </div>

                      <div className={styles.statCard}>
                        <div className={styles.statInfo}>
                          <div className={styles.statVal}>{stats.soldProperties}</div>
                          <div className={styles.statLabel}>Sold Properties</div>
                        </div>
                        <div className={styles.statIconBox}>
                          <Check size={20} strokeWidth={1.5} />
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
                </div>
              )}

              {activeTab === "inquiries" && (
                <div>
                  <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", marginBottom: "1.5rem", fontWeight: 400 }}>
                    Client Enquiries
                  </h3>
                  {inquiries.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Ref ID</th>
                            <th>Customer</th>
                            <th>Property</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inquiries.map((inq) => {
                            return (
                              <tr key={inq._id}>
                                <td style={{ fontWeight: 600 }}>#{inq.property.propertyId}</td>
                                <td style={{ fontWeight: 500 }}>{inq.user.name}</td>
                                <td>{inq.property.title}</td>
                                <td>{new Date(inq.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <span style={{ 
                                    fontWeight: 600, 
                                    color: inq.status === "new" ? "var(--color-primary-dark)" : "var(--color-dark-muted)",
                                    backgroundColor: inq.status === "new" ? "rgba(76, 131, 161, 0.15)" : "rgba(0, 0, 0, 0.05)",
                                    padding: "0.25rem 0.6rem",
                                    fontSize: "0.75rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                  }}>
                                    {inq.status === "new" ? "New" : "Reviewed"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                    <button
                                      onClick={() => setSelectedInquiry(inq)}
                                      className={styles.actionBtn}
                                      style={{ color: "var(--color-primary-dark)", textDecoration: "none", border: "1px solid var(--color-border)", padding: "0.25rem 0.5rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                                    >
                                      <Eye size={14} />
                                      <span>View More</span>
                                    </button>
                                    {inq.status === "new" && (
                                      <button
                                        onClick={() => handleMarkReviewed(inq._id)}
                                        className={styles.actionBtn}
                                        style={{ color: "#4eb570", textDecoration: "none", border: "1px solid var(--color-border)", padding: "0.25rem 0.5rem", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                                      >
                                        <Check size={14} />
                                        <span>Mark Reviewed</span>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyMsg}>No interest inquiries registered in the database.</div>
                  )}
                </div>
              )}

              {activeTab === "admins" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400, margin: 0 }}>
                      Active Vendor Accounts
                    </h3>
                    <button
                      onClick={() => {
                        cancelEditAdmin();
                        setIsAddAdminModalOpen(true);
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
                      <span>Add Admin</span>
                    </button>
                  </div>

                  {/* Active Admins List */}
                  <div>
                    {admins.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email ID</th>
                              <th>Phone No.</th>
                              <th>Created On</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {admins.map((adm) => (
                              <tr key={adm._id}>
                                <td style={{ fontWeight: 500 }}>{adm.name}</td>
                                <td>{adm.email}</td>
                                <td>{adm.phone || "N/A"}</td>
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
                      <div className={styles.emptyMsg}>No admins registered yet. Click "Add Admin" to register one.</div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "employees" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400, margin: 0 }}>
                      Active Employee Accounts
                    </h3>
                    <button
                      onClick={() => {
                        cancelEditAdmin();
                        setIsAddAdminModalOpen(true);
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
                      <span>Add Employee</span>
                    </button>
                  </div>

                  <div>
                    {employees.length > 0 ? (
                      <div className={styles.tableContainer}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email ID</th>
                              <th>Phone No.</th>
                              <th>Created On</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employees.map((emp) => (
                              <tr key={emp._id}>
                                <td style={{ fontWeight: 500 }}>{emp.name}</td>
                                <td>{emp.email}</td>
                                <td>{emp.phone || "N/A"}</td>
                                <td>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                                    <button
                                      onClick={() => startEditAdmin(emp)}
                                      title="Edit Employee"
                                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-primary-dark)", padding: 0 }}
                                    >
                                      <Edit size={16} strokeWidth={1.8} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAdmin(emp._id, emp.name)}
                                      title="Delete Employee"
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
                      <div className={styles.emptyMsg}>No employees registered yet. Click "Add Employee" to register one.</div>
                    )}
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
                              <td>{u.email}</td>
                              <td>
                                <span style={{ fontWeight: 600, color: u.isBlocked ? "#e05e5e" : "#4eb570" }}>
                                  {u.isBlocked ? "Blocked" : "Active"}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>

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
                        <CustomSelect
                          options={[
                            { value: "", label: "All Vendors" },
                            { value: "super_admin", label: "Super Admin" },
                            ...admins.map(admin => ({ value: admin._id, label: admin.name }))
                          ]}
                          value={selectedAdminId}
                          onChange={(val) => setSelectedAdminId(val)}
                          className={styles.select}
                          style={{ minWidth: "220px", padding: 0, border: 'none' }}
                        />
                      </div>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Listing Type:</label>
                        <CustomSelect
                          options={[
                            { value: "All", label: "All" },
                            { value: "Rent", label: "Rent" },
                            { value: "Sell", label: "Sell" }
                          ]}
                          value={propertyListingFilter}
                          onChange={(val) => setPropertyListingFilter(val)}
                          className={styles.select}
                          style={{ minWidth: "120px", padding: 0, border: 'none' }}
                        />
                      </div>

                      <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className={styles.submitBtn}
                        style={{ 
                          padding: "0.6rem 1.5rem", 
                          fontSize: "0.8rem", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "0.5rem",
                          backgroundColor: "transparent",
                          color: "var(--color-dark)",
                          border: "1px solid #a0a0a0",
                          borderRadius: "4px"
                        }}
                      >
                        <Settings size={16} />
                        <span>Property Type</span>
                      </button>
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
                            <th>City</th>
                            <th>Location</th>
                            <th>Price</th>
                            <th>Vendor</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {properties
                            .filter(prop => propertyListingFilter === "All" || (prop.listingType || "Sell").toLowerCase() === propertyListingFilter.toLowerCase())
                            .map((prop) => {
                            return (
                              <tr key={prop._id}>
                                <td style={{ fontWeight: 600 }}>#{prop.propertyId}</td>
                                <td>
                                  <img
                                    src={getImageUrl(prop.images[0])}
                                    alt="thumb"
                                    style={{ width: "60px", height: "40px", objectFit: "contain", backgroundColor: "#FFFFFF", border: "1px solid var(--color-border)" }}
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
                                <td style={{ fontWeight: 500 }}>{prop.addedByName}</td>
                                <td>
                                  <span style={{ fontWeight: 600, color: prop.status === "available" ? "#4eb570" : "#888" }}>
                                    {prop.status === "available" ? "Available" : "Sold"}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ position: "relative" }}>
                                    <button 
                                      onClick={() => setOpenPropertyMenuId(openPropertyMenuId === prop._id ? null : prop._id)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', color: 'var(--color-dark)' }}
                                      aria-label="More actions"
                                    >
                                      <MoreVertical size={20} />
                                    </button>
                                    
                                    {openPropertyMenuId === prop._id && (
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
                                            setPropConfirmStatusModal({ isOpen: true, property: prop });
                                            setOpenPropertyMenuId(null);
                                          }}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-dark)'
                                          }}
                                        >
                                          {prop.status === "available" ? "Mark Sold" : "Mark Available"}
                                        </button>
                                        <Link 
                                          href={`/properties/${prop._id}`} 
                                          style={{
                                            padding: '0.5rem 1rem',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-dark)',
                                            textDecoration: 'none'
                                          }}
                                        >
                                          View Property
                                        </Link>
                                        <button 
                                          onClick={() => handleEditProperty(prop)}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-primary-dark)'
                                          }}
                                        >
                                          Edit Property
                                        </button>
                                        <button 
                                          onClick={() => {
                                            setPropConfirmDeleteModal({ isOpen: true, property: prop });
                                            setOpenPropertyMenuId(null);
                                          }}
                                          style={{
                                            padding: '0.5rem 1rem',
                                            textAlign: 'left',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-error, #e05e5e)'
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
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

              {activeTab === "activity_logs" && user?.role === "super_admin" && (
                <div>
                  <div className={styles.filterBar} style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 400 }}>
                      Activity Logs
                    </h3>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Role:</label>
                        <CustomSelect
                          options={[
                            { value: "All", label: "All Roles" },
                            { value: "Super Admin", label: "Super Admin" },
                            { value: "Vendor", label: "Vendor" },
                            { value: "Employee", label: "Employee" }
                          ]}
                          value={logRoleFilter}
                          onChange={(val) => setLogRoleFilter(val)}
                          style={{ minWidth: "140px", padding: 0, border: 'none' }}
                        />
                      </div>
                      
                      {logRoleFilter !== "All" && logRoleFilter !== "Super Admin" && (
                        <div className={styles.filterGroup}>
                          <label className={styles.filterLabel}>User:</label>
                          <CustomSelect
                            options={[
                              { value: "", label: fetchingRoleUsers ? "Loading..." : "All Users" },
                              ...roleUsers.map((u) => ({ value: u._id, label: u.name }))
                            ]}
                            value={logUserFilter}
                            onChange={(val) => setLogUserFilter(val)}
                            style={{ minWidth: "160px", padding: 0, border: 'none' }}
                          />
                        </div>
                      )}

                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>Start Date:</label>
                        <input 
                          type="date" 
                          value={logStartDate}
                          onChange={(e) => setLogStartDate(e.target.value)}
                          style={{ padding: "0.4rem", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                      </div>
                      <div className={styles.filterGroup}>
                        <label className={styles.filterLabel}>End Date:</label>
                        <input 
                          type="date" 
                          value={logEndDate}
                          onChange={(e) => setLogEndDate(e.target.value)}
                          style={{ padding: "0.4rem", border: "1px solid #ccc", borderRadius: "4px" }}
                        />
                      </div>
                      <button
                        onClick={exportToPDF}
                        className={styles.submitBtn}
                        style={{ 
                          padding: "0.4rem 0.8rem", 
                          fontSize: "0.8rem", 
                          height: "fit-content", 
                          alignSelf: "flex-end",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          width: "max-content",
                          minWidth: "max-content",
                          flexShrink: 0
                        }}
                        disabled={activityLogs.length === 0}
                      >
                        <Download size={16} />
                        Export to PDF
                      </button>
                    </div>
                  </div>

                  {logsLoading ? (
                    <div style={{ textAlign: "center", padding: "3rem" }}>Loading activity logs...</div>
                  ) : activityLogs.length > 0 ? (
                    <div className={styles.tableContainer}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Role</th>
                            <th>User Name</th>
                            <th>Action</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activityLogs.map((log) => (
                            <tr key={log._id}>
                              <td style={{ whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString()}</td>
                              <td>
                                <span style={{ 
                                  padding: "0.25rem 0.5rem", 
                                  borderRadius: "4px", 
                                  fontSize: "0.75rem", 
                                  fontWeight: 600,
                                  backgroundColor: log.userRole === "Super Admin" ? "#ffebee" : log.userRole === "Vendor" ? "#e3f2fd" : "#f1f8e9",
                                  color: log.userRole === "Super Admin" ? "#c62828" : log.userRole === "Vendor" ? "#1565c0" : "#2e7d32"
                                }}>
                                  {log.userRole}
                                </span>
                              </td>
                              <td style={{ fontWeight: 500 }}>{log.userName}</td>
                              <td>{log.action}</td>
                              <td style={{ fontSize: "0.85rem", color: "#666" }}>{log.details || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={styles.emptyMsg}>No activity logs found for the selected filters.</div>
                  )}
                </div>
              )}

            </>
          )}
        </main>
      </div>

      {/* Add Admin/Employee Modal */}
      {isAddAdminModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddAdminModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setIsAddAdminModalOpen(false)}
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle} style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 400, marginBottom: "2rem" }}>
              {editingAdminId ? (activeTab === "employees" ? "Edit Employee Details" : "Edit Admin Details") : (activeTab === "employees" ? "Register Employee" : "Register Vendor Admin")}
            </h2>
            <form onSubmit={handleAddAdminSubmit}>
              {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
              {successMsg && <div className={styles.successBox}>{successMsg}</div>}

              <div className={styles.formGroup}>
                <label className={styles.label}>{activeTab === "employees" ? "Employee Name" : "Admin Name"}</label>
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
                <label className={styles.label}>Email ID (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. rachel@plotandacre.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. 9900099000"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={styles.input}
                  pattern="[6-9][0-9]{9}"
                  title="Phone number must be exactly 10 digits starting with 6-9"
                  maxLength={10}
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



              <div className={styles.modalActionContainer} style={{ marginTop: "2rem" }}>
                <button type="submit" className={styles.submitBtn} disabled={addAdminLoading}>
                  {addAdminLoading ? "Saving..." : editingAdminId ? (activeTab === "employees" ? "Update Employee Account" : "Update Admin Account") : (activeTab === "employees" ? "Add Employee Account" : "Add Admin Account")}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className={styles.submitBtn}
                  style={{ backgroundColor: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-border)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCategoryModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px" }}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setIsCategoryModalOpen(false)}
            >
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle} style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
              Property Type Management
            </h2>

            {/* Listing Type Toggle at the Top */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setCatListingType("Sell")}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  background: catListingType === "Sell" ? 'var(--color-primary)' : 'transparent',
                  color: catListingType === "Sell" ? 'white' : 'var(--color-dark)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Sell Types
              </button>
              <button
                type="button"
                onClick={() => setCatListingType("Rent")}
                style={{
                  flex: 1,
                  padding: '0.8rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  background: catListingType === "Rent" ? 'var(--color-primary)' : 'transparent',
                  color: catListingType === "Rent" ? 'white' : 'var(--color-dark)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Rent Types
              </button>
            </div>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
              {/* New Category Form */}
              <div style={{ flex: "1 1 300px" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary-dark)" }}>{editingCategoryId ? "EDIT PROPERTY TYPE" : "NEW PROPERTY TYPE"}</h3>
                <form onSubmit={handleAddCategorySubmit}>
                  {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}
                  {successMsg && <div className={styles.successBox}>{successMsg}</div>}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Property Type Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Commercial"
                      value={catName}
                      onChange={(e) => setCatName(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label className={styles.label} style={{ margin: 0 }}>Fields (Max 3)</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (catFields.length < 3) {
                          setCatFields([...catFields, { name: "", type: "text", unit: "" }]);
                        }
                      }}
                      className={styles.addBtn}
                      disabled={catFields.length >= 3}
                      style={{ 
                        padding: "0.25rem 0.5rem", 
                        fontSize: "0.75rem", 
                        height: "auto",
                        cursor: catFields.length >= 3 ? "not-allowed" : "pointer", 
                        background: "transparent",
                        color: "var(--color-dark-muted)",
                        border: "1px solid var(--color-border)",
                        opacity: catFields.length >= 3 ? 0.5 : 1
                      }}
                    >
                      <PlusCircle size={14} /> Add
                    </button>
                  </div>
                  
                  {catFields.length === 0 ? (
                    <div style={{ padding: "1rem", border: "1px dashed var(--color-border)", textAlign: "center", fontSize: "0.8rem", color: "var(--color-dark-muted)", marginBottom: "1.5rem" }}>
                      NO CUSTOM FIELDS
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", maxHeight: "250px", overflowY: "auto", paddingRight: "0.5rem" }}>
                      {catFields.map((field, index) => {
                        const SuggestedIcon = getIconForField(field.name);
                        return (
                          <div key={index} style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "var(--color-bg-light)", padding: "0.5rem", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                            <div style={{ padding: "0.4rem", color: "var(--color-primary-dark)", display: "flex", alignItems: "center", justifyContent: "center" }} title={`Suggested Icon for "${field.name}"`}>
                              <SuggestedIcon size={18} />
                            </div>
                            <input 
                              type="text" 
                              placeholder="Field Name" 
                              value={field.name}
                              onChange={(e) => {
                                const newFields = [...catFields];
                                newFields[index].name = e.target.value;
                                setCatFields(newFields);
                              }}
                              className={styles.input}
                              style={{ flex: 2, padding: "0.4rem" }}
                              required
                            />

                          <button 
                            type="button" 
                            onClick={() => {
                              const newFields = [...catFields];
                              newFields.splice(index, 1);
                              setCatFields(newFields);
                            }}
                            style={{ background: "none", border: "none", color: "#e05e5e", cursor: "pointer", padding: "0.2rem" }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button type="submit" className={styles.submitBtn} disabled={catAddLoading} style={{ flex: 1 }}>
                      {catAddLoading ? "Saving..." : editingCategoryId ? "Update Property Type" : "Add Property Type"}
                    </button>
                    {editingCategoryId && (
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingCategoryId(null);
                          setCatName("");
                          setCatFields([]);
                        }}
                        className={styles.submitBtn} 
                        style={{ flex: 1, backgroundColor: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-border)" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Existing Categories List */}
              <div style={{ flex: "1 1 300px" }}>
                <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-primary-dark)" }}>EXISTING PROPERTY TYPES ({catListingType.toUpperCase()})</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "350px", overflowY: "auto", paddingRight: "0.5rem" }}>
                  {categories.filter((c: any) => (c.listingType || "Sell") === catListingType).length > 0 ? (
                    categories.filter((c: any) => (c.listingType || "Sell") === catListingType).map(cat => (
                      <div key={cat._id} style={{ border: "1px solid var(--color-border)", borderRadius: "6px", padding: "0.6rem 0.8rem", backgroundColor: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2rem" }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 500 }}>{cat.name}</h4>
                          <div style={{ display: "flex", gap: "0.8rem" }}>
                            <button 
                              onClick={() => {
                                setEditingCategoryId(cat._id);
                                setCatName(cat.name);
                                setCatFields(cat.fields);
                              }}
                              style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", padding: 0 }}
                              title="Edit Property Type"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={async () => {
                              if(confirm(`Delete category ${cat.name}?`)) {
                                try {
                                  await apiRequest(`/categories/${cat._id}`, { method: 'DELETE' });
                                  const newCatData = await apiRequest("/categories");
                                  setCategories(newCatData);
                                } catch(e: any) {
                                  alert(e.message);
                                }
                              }
                            }}
                            style={{ background: "none", border: "none", color: "#e05e5e", cursor: "pointer", padding: 0 }}
                            title="Delete Property Type"
                          >
                            <Trash2 size={16} />
                          </button>
                          </div>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-dark-muted)" }}>
                          {cat.fields.length} fields defined
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.9rem", color: "var(--color-dark-muted)" }}>No categories created yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              {propEditMode ? "Edit Property (Super Admin)" : "Register Residence Listing (Super Admin)"}
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
                    placeholder="Enter title"
                    value={propTitle}
                    onChange={(e) => setPropTitle(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>City *</label>
                  <AutocompleteInput
                    value={propCity}
                    onChange={(val) => setPropCity(val)}
                    options={citySuggestions}
                    placeholder="Enter city"
                    required={true}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                  <label className={styles.label}>Location Address *</label>
                  <input
                    type="text"
                    placeholder="Enter location address"
                    value={propLocation}
                    onChange={(e) => setPropLocation(e.target.value)}
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
                      value={propPrice}
                      onChange={(e) => setPropPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      className={styles.input}
                      required
                      style={{ flex: 1 }}
                    />
                    {propListingType === "Rent" && (
                      <select 
                        value={propRentFrequency} 
                        onChange={(e) => setPropRentFrequency(e.target.value)}
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
                  {propListingType === "Rent" && propRentFrequency === "Other" && (
                    <input
                      type="text"
                      placeholder="e.g. Week or 15 Days"
                      value={propCustomRentFrequency}
                      onChange={(e) => setPropCustomRentFrequency(e.target.value)}
                      className={styles.input}
                      style={{ marginTop: '0.5rem' }}
                      required
                    />
                  )}
                  {propPrice && (
                    <span className={styles.helperText} style={{ marginTop: '0.4rem', display: 'block', color: 'var(--color-primary-dark)', fontWeight: 500 }}>
                      {formatIndianPrice(Number(propPrice))}
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

                <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className={styles.label}>Premium Property</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={propIsPremium}
                      onChange={(e) => setPropIsPremium(e.target.checked)}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>(SHOWS IN BEST PROPERTIES)</span>
                  </label>
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
                    id="superImageFiles"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files) {
                        let validFiles = Array.from(files).filter(file => file.size <= 20 * 1024 * 1024);
                        if (validFiles.length !== files.length) {
                          alert("Some files exceed the 20MB limit and were removed.");
                        }

                        setPropAddLoading(true);
                        const compressedFiles: File[] = [];
                        for (let file of validFiles) {
                          try {
                            const compressedFile = await imageCompression(file, {
                              maxSizeMB: 0.15,
                              maxWidthOrHeight: 1024,
                              useWebWorker: true,
                            });
                            // Reconstruct the file with the original name to preserve the extension for the backend
                            const finalFile = new File([compressedFile], file.name, {
                              type: compressedFile.type,
                              lastModified: Date.now(),
                            });
                            compressedFiles.push(finalFile);
                          } catch (err) {
                            console.error("Image compression error:", err);
                            compressedFiles.push(file);
                          }
                        }
                        setPropAddLoading(false);

                        setPropSelectedFiles(prev => {
                          const currentTotal = propExistingImages.length + prev.length;
                          if (currentTotal >= 6) {
                            alert("You can only upload a maximum of 6 images.");
                            return prev;
                          }
                          const allowedSpaces = 6 - currentTotal;
                          let finalFiles = compressedFiles;
                          if (finalFiles.length > allowedSpaces) {
                            alert(`You can only add ${allowedSpaces} more image(s). Extra images were discarded.`);
                            finalFiles = finalFiles.slice(0, allowedSpaces);
                          }
                          return [...prev, ...finalFiles];
                        });
                      }
                      e.target.value = "";
                    }}
                    disabled={propExistingImages.length + propSelectedFiles.length >= 6}
                    className={styles.input}
                    style={{ padding: "0.6rem" }}
                  />
                  <span className={styles.helperText} style={{ display: 'block', marginTop: '0.2rem' }}>Select multiple image files (Max 20MB per file, auto-compressed on upload).</span>

                  {(propExistingImages.length > 0 || propImagePreviews.length > 0) && (
                    <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {propExistingImages.map((src, index) => (
                        <div key={`existing-${index}`} style={{ position: 'relative' }}>
                          <img 
                            src={getImageUrl(src)} 
                            alt={`Existing ${index}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setPropExistingImages(prev => prev.filter((_, i) => i !== index));
                              setPropRemovedImages(prev => [...prev, src]);
                            }}
                            style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#e05e5e', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {propImagePreviews.map((src, index) => (
                        <div key={`new-${index}`} style={{ position: 'relative' }}>
                          <img 
                            src={src} 
                            alt={`New ${index}`} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--color-border)' }} 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              setPropSelectedFiles(prev => prev.filter((_, i) => i !== index));
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



                <div className={styles.formGroup}>
                  <label className={styles.label}>Features (Max 6)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      placeholder="e.g. 5 Mins from Metro Station"
                      value={keyPointInput}
                      onChange={(e) => setKeyPointInput(e.target.value)}
                      className={styles.input}
                      style={{ flex: 1, height: '45px', margin: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (keyPointInput.trim() && keyPoints.length < 6) {
                            setKeyPoints([...keyPoints, keyPointInput.trim()]);
                            setKeyPointInput("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (keyPointInput.trim() && keyPoints.length < 6) {
                          setKeyPoints([...keyPoints, keyPointInput.trim()]);
                          setKeyPointInput("");
                        }
                      }}
                      className={styles.submitBtn}
                      style={{ padding: '0 1.5rem', width: 'auto', height: '45px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={keyPoints.length >= 6 || !keyPointInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {keyPoints.map((kp, idx) => (
                      <span key={idx} style={{ background: 'var(--color-bg-light)', border: '1px solid var(--color-border)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {kp}
                        <button type="button" onClick={() => setKeyPoints(keyPoints.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e05e5e', cursor: 'pointer', padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Amenities (Max 6)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      placeholder="e.g. Swimming Pool, Gym"
                      value={amenityInput}
                      onChange={(e) => setAmenityInput(e.target.value)}
                      className={styles.input}
                      style={{ flex: 1, height: '45px', margin: 0 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (amenityInput.trim() && amenities.length < 6) {
                            setAmenities([...amenities, amenityInput.trim()]);
                            setAmenityInput("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (amenityInput.trim() && amenities.length < 6) {
                          setAmenities([...amenities, amenityInput.trim()]);
                          setAmenityInput("");
                        }
                      }}
                      className={styles.submitBtn}
                      style={{ padding: '0 1.5rem', width: 'auto', height: '45px', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={amenities.length >= 6 || !amenityInput.trim()}
                    >
                      Add
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {amenities.map((am, idx) => (
                      <span key={idx} style={{ background: 'var(--color-bg-light)', border: '1px solid var(--color-border)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {am}
                        <button type="button" onClick={() => setAmenities(amenities.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#e05e5e', cursor: 'pointer', padding: 0 }}>✕</button>
                      </span>
                    ))}
                  </div>
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

              {errorMsg && <div className={styles.errorBox} style={{ marginBottom: '1rem' }}>{errorMsg}</div>}
              {successMsg && <div className={styles.successBox} style={{ marginBottom: '1rem' }}>{successMsg}</div>}
              <button type="submit" className={styles.submitBtn} disabled={propAddLoading}>
                {propAddLoading ? "Saving Property..." : propEditMode ? "Update Property Listing" : "Submit Property Listing"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className={styles.modalOverlay} onClick={() => setSelectedInquiry(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setSelectedInquiry(null)}
              aria-label="Close Inquiry Details"
            >
              <X size={20} />
            </button>

            <h2 className={styles.modalTitle} style={{ fontFamily: "var(--font-serif)", fontSize: "1.6rem", fontWeight: 400, marginBottom: "1rem" }}>
              Enquiry Details
            </h2>
            <span className={styles.modalBadge} style={{ 
              fontWeight: 600, 
              color: selectedInquiry.status === "new" ? "var(--color-primary-dark)" : "var(--color-dark-muted)",
              backgroundColor: selectedInquiry.status === "new" ? "rgba(76, 131, 161, 0.15)" : "rgba(0, 0, 0, 0.05)",
              padding: "0.3rem 0.8rem",
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "inline-block",
              marginBottom: "2.5rem"
            }}>
              {selectedInquiry.status === "new" ? "New Query" : "Reviewed"}
            </span>

            <div className={styles.inquiryMeta} style={{ marginBottom: "2rem" }}>
              <div className={styles.metaBlock}>
                <div className={styles.metaBlockTitle}>Buyer Details</div>
                <div className={styles.metaItem}>Name: <strong>{selectedInquiry.user.name}</strong></div>
                <div className={styles.metaItem}>Phone: <strong>{selectedInquiry.user.phone}</strong></div>
                <div className={styles.metaItem}>City: <strong>{selectedInquiry.user.city}</strong></div>
                <div className={styles.metaItem}>Email ID: <strong>{selectedInquiry.user.email}</strong></div>
              </div>

              <div className={styles.metaBlock}>
                <div className={styles.metaBlockTitle}>Property Details</div>
                <div className={styles.metaItem}>Ref ID: <strong>#{selectedInquiry.property.propertyId}</strong></div>
                <div className={styles.metaItem}>Title: <strong>{selectedInquiry.property.title}</strong></div>
                <div className={styles.metaItem}>Location: <strong>{selectedInquiry.property.location}</strong></div>
                <div className={styles.metaItem}>Value: <strong>{formatIndianPrice(selectedInquiry.property.price)}</strong></div>
                <div className={styles.metaItem}>Vendor Admin: <strong>{selectedInquiry.property.addedByAdminName}</strong></div>
              </div>
            </div>

            <div className={styles.inquiryText} style={{ marginBottom: "2.5rem" }}>
              <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-dark-muted)", marginBottom: "0.5rem" }}>
                Query Message:
              </div>
              "{selectedInquiry.queryText}"
            </div>

            <div className={styles.modalActionContainer}>
              {selectedInquiry.status === "new" && (
                <button
                  onClick={() => {
                    handleMarkReviewed(selectedInquiry._id);
                    setSelectedInquiry(null);
                  }}
                  className={styles.submitBtn}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.8rem 1.5rem" }}
                >
                  <Check size={16} />
                  <span>Mark as Reviewed</span>
                </button>
              )}
              <button
                onClick={() => setSelectedInquiry(null)}
                className={styles.submitBtn}
                style={{ 
                  backgroundColor: "transparent", 
                  color: "var(--color-dark)", 
                  border: "1px solid var(--color-border)",
                  padding: "0.8rem 1.5rem"
                }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Status Update Confirmation Modal */}
      {propConfirmStatusModal.isOpen && propConfirmStatusModal.property && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "400px", textAlign: "center", padding: "3rem 2rem" }}>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-dark)" }}>
              Change Property Status
            </h2>
            <p style={{ color: "var(--color-dark-muted)", marginBottom: "2rem", lineHeight: "1.5" }}>
              Are you sure you want to mark <strong>{propConfirmStatusModal.property.title}</strong> as{" "}
              <span style={{ fontWeight: 600, color: propConfirmStatusModal.property.status === "available" ? "#e05e5e" : "#4eb570" }}>
                {propConfirmStatusModal.property.status === "available" ? "Sold" : "Available"}
              </span>?
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setPropConfirmStatusModal({ isOpen: false, property: null })}
                className={styles.submitBtn}
                style={{ backgroundColor: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-border)", flex: 1 }}
                disabled={propStatusUpdateLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdateProperty}
                className={styles.submitBtn}
                style={{ flex: 1 }}
                disabled={propStatusUpdateLoading}
              >
                {propStatusUpdateLoading ? "Updating..." : "Yes, Change Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {propConfirmDeleteModal.isOpen && propConfirmDeleteModal.property && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "400px", textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              borderRadius: "50%", 
              backgroundColor: "rgba(224, 94, 94, 0.1)", 
              color: "#e05e5e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto"
            }}>
              <Trash2 size={28} />
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-dark)" }}>
              Delete Property
            </h2>
            <p style={{ color: "var(--color-dark-muted)", marginBottom: "2rem", lineHeight: "1.5" }}>
              Are you sure you want to delete <strong>{propConfirmDeleteModal.property.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                onClick={() => setPropConfirmDeleteModal({ isOpen: false, property: null })}
                className={styles.submitBtn}
                style={{ backgroundColor: "transparent", color: "var(--color-dark)", border: "1px solid var(--color-border)", flex: 1 }}
                disabled={propDeleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProperty}
                className={styles.submitBtn}
                style={{ backgroundColor: "#e05e5e", flex: 1 }}
                disabled={propDeleteLoading}
              >
                {propDeleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
