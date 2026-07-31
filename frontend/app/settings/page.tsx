"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { apiRequest } from "@/utils/api";
import Loader from "@/components/Loader";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { 
  User, MapPin, Lock, Info, LogOut, 
  ChevronRight, Edit2, Shield, X, Eye, EyeOff, LayoutDashboard, ArrowLeft
} from "lucide-react";
import styles from "./page.module.css";

export default function SettingsPage() {
  const { user, loading, logout, updateProfile, updateProfileImage } = useAuth();
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"editProfile" | "changePassword" | "cropProfileImage" | "profilePhotoOptions" | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Profile Image Cropping State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // Edit Profile State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpSent, setOtpSent] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user) {
      setEditName(user.name);
      setEditPhone(user.phone || "");
      setEditCity(user.city || "");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader />
      </div>
    );
  }

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    const detailsSuccess = await updateProfile({
      name: editName,
      phone: editPhone,
      city: editCity,
    });
    if (detailsSuccess) {
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => {
        setActiveModal(null);
        setProfileSuccess("");
      }, 1500);
    } else {
      setProfileError("Failed to update profile details.");
    }
    
    setProfileLoading(false);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setActiveModal("cropProfileImage");
    }
    e.target.value = ""; // Reset so they can select the same file again
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as string), false);
      reader.readAsDataURL(file);
    });
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedImageFile) {
        if (croppedImageFile.size > 3 * 1024 * 1024) {
           alert("Cropped file size exceeds 3MB limit.");
           setIsCropping(false);
           return;
        }
        const imgSuccess = await updateProfileImage(croppedImageFile);
        if (imgSuccess) {
          setActiveModal(null);
          setImageSrc(null);
        } else {
          alert("Failed to upload profile picture.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error cropping image");
    }
    setIsCropping(false);
  };

  const handleSendPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError("Please fill out all password fields.");
      setPassLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("New password and confirm password do not match.");
      setPassLoading(false);
      return;
    }

    try {
      await apiRequest("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: user?.phone }),
      });
      setOtpSent(true);
      setPassSuccess("OTP sent to your registered phone number.");
    } catch (err: any) {
      setPassError(err.message || "Failed to send OTP.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setPassError("Please enter the complete 6-digit OTP.");
      setPassLoading(false);
      return;
    }

    try {
      await apiRequest("/auth/update-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          otp: otpString,
        }),
      });
      setPassSuccess("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp(["", "", "", "", "", ""]);
      setOtpSent(false);
      setTimeout(() => {
        setActiveModal(null);
        setPassSuccess("");
      }, 1500);
    } catch (err: any) {
      setPassError(err.message || "Failed to verify OTP or update password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div className={styles.container}>
      {/* Top Profile Card */}
      <div className={styles.profileCard}>
        <button onClick={() => router.back()} className={styles.backBtn} aria-label="Go Back">
          <ArrowLeft size={24} />
        </button>
        <div className={styles.avatarContainer}>
          {user.profileImage ? (
            <img src={user.profileImage} alt={user.name} className={styles.avatarImage} />
          ) : (
            <div className={styles.avatarImage}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <input 
            type="file" 
            id="profilePhotoInput" 
            accept="image/*" 
            style={{ display: "none" }} 
            onChange={onFileChange} 
          />
          <div 
            className={styles.editIcon} 
            onClick={() => setActiveModal("profilePhotoOptions")}
          >
            <Edit2 size={16} />
          </div>
        </div>
        <div className={styles.profileInfo}>
          <h2 className={styles.profileName}>
            {user.name.toUpperCase()}
          </h2>
          <p className={styles.profilePhone}>{user.phone ? `+91 ${user.phone}` : "No Phone Added"}</p>
        </div>
      </div>

      {/* MY ACCOUNT */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>MY ACCOUNT</div>
        <div className={styles.card}>
          <button className={styles.listItem} onClick={() => setActiveModal("editProfile")}>
            <div className={styles.listItemContent}>
              <div className={styles.iconWrapper}><User size={20} /></div>
              <span>Edit Profile Details</span>
            </div>
            <ChevronRight size={20} className={styles.arrowIcon} />
          </button>
        </div>
      </div>

      {/* PREFERENCES */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>PREFERENCES</div>
        <div className={styles.card}>
          <button className={styles.listItem} onClick={() => setActiveModal("changePassword")}>
            <div className={styles.listItemContent}>
              <div className={styles.iconWrapper}><Shield size={20} /></div>
              <span>Security & Password</span>
            </div>
            <ChevronRight size={20} className={styles.arrowIcon} />
          </button>
        </div>
      </div>

      {/* ADMINISTRATION */}
      {(user.role === "admin" || user.role === "super_admin") && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>ADMINISTRATION</div>
          <div className={styles.card}>
            <button 
              className={styles.listItem} 
              onClick={() => router.push(user.role === "admin" ? "/admin/dashboard" : "/super-admin/dashboard")}
            >
              <div className={styles.listItemContent}>
                <div className={styles.iconWrapper}><LayoutDashboard size={20} /></div>
                <span>Admin Dashboard</span>
              </div>
              <ChevronRight size={20} className={styles.arrowIcon} />
            </button>
          </div>
        </div>
      )}

      {/* SUPPORT */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>SUPPORT</div>
        <div className={styles.card}>
          <button className={styles.listItem} onClick={handleLogout}>
            <div className={styles.listItemContent}>
              <div className={styles.iconWrapper}><LogOut size={20} color="#e53935" /></div>
              <span className={styles.logoutBtn}>Logout</span>
            </div>
          </button>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {activeModal === "editProfile" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile</h3>
              <button className={styles.closeBtn} onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleEditProfileSubmit}>
              {profileError && <div className={styles.errorMsg}>{profileError}</div>}
              {profileSuccess && <div className={styles.successMsg}>{profileSuccess}</div>}

              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>City (Optional)</label>
                <input
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className={styles.input}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={profileLoading}>
                {profileLoading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {activeModal === "changePassword" && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Security & Password</h3>
              <button className={styles.closeBtn} onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            
            <form onSubmit={otpSent ? handleUpdatePassword : handleSendPasswordOtp}>
              {passError && <div className={styles.errorMsg}>{passError}</div>}
              {passSuccess && <div className={styles.successMsg}>{passSuccess}</div>}

              <div className={styles.formGroup} style={{ display: otpSent ? "none" : "block" }}>
                <label className={styles.label}>Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.input}
                    required={!otpSent}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ position: "absolute", right: "1rem", top: "0.9rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-dark-muted)" }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup} style={{ display: otpSent ? "none" : "block" }}>
                <label className={styles.label}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.input}
                    required={!otpSent}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: "absolute", right: "1rem", top: "0.9rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-dark-muted)" }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup} style={{ display: otpSent ? "none" : "block" }}>
                <label className={styles.label}>Confirm New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.input}
                    required={!otpSent}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: "absolute", right: "1rem", top: "0.9rem", background: "none", border: "none", cursor: "pointer", color: "var(--color-dark-muted)" }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Enter OTP (sent to {user?.phone})</label>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", maxWidth: "350px", margin: "0 auto" }}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        ref={(el) => {
                           otpRefs.current[idx] = el;
                        }}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); // only allow digits
                          if (val.length > 1) return;
                          const newOtp = [...otp];
                          newOtp[idx] = val;
                          setOtp(newOtp);
                          if (val !== "" && idx < 5) {
                            otpRefs.current[idx + 1]?.focus();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, 6);
                          if (pastedData) {
                            const newOtp = [...otp];
                            for (let i = 0; i < pastedData.length; i++) {
                              if (idx + i < 6) {
                                newOtp[idx + i] = pastedData[i];
                              }
                            }
                            setOtp(newOtp);
                            const nextFocus = Math.min(idx + pastedData.length, 5);
                            otpRefs.current[nextFocus]?.focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && otp[idx] === "" && idx > 0) {
                            otpRefs.current[idx - 1]?.focus();
                          }
                        }}
                        className={styles.input}
                        style={{ width: "45px", height: "45px", textAlign: "center", fontSize: "1.2rem", padding: "0" }}
                        required
                      />
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={passLoading}>
                {passLoading ? "Processing..." : otpSent ? "Verify & Update Password" : "Send OTP"}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* IMAGE CROP MODAL */}
      {activeModal === "cropProfileImage" && imageSrc && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Crop Profile Photo</h3>
              <button className={styles.closeBtn} onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            
            <div className={styles.cropContainer}>
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className={styles.cropControls}>
              <label className={styles.label}>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className={styles.zoomSlider}
              />
            </div>

            <button onClick={handleCropSave} className={styles.submitBtn} disabled={isCropping}>
              {isCropping ? "Saving..." : "Save Profile Photo"}
            </button>
          </div>
        </div>
      )}

      {/* PROFILE PHOTO OPTIONS MODAL */}
      {activeModal === "profilePhotoOptions" && (
        <div className={styles.modalOverlay} onClick={() => { setActiveModal(null); setShowRemoveConfirm(false); }}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{showRemoveConfirm ? "Remove Photo" : "Profile Photo Options"}</h3>
              <button className={styles.closeBtn} onClick={() => { setActiveModal(null); setShowRemoveConfirm(false); }}><X size={20} /></button>
            </div>
            
            {!showRemoveConfirm ? (
              <div className={styles.profilePhotoModalContainer}>
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className={styles.profilePhotoPreview} />
                ) : (
                  <div className={styles.profilePhotoPlaceholder}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className={styles.profilePhotoBtnContainer}>
                  <button 
                    className={`${styles.submitBtn} ${styles.profilePhotoBtn} ${styles.profilePhotoBtnPrimary}`} 
                    onClick={() => {
                      document.getElementById("profilePhotoInput")?.click();
                      setActiveModal(null);
                    }}
                  >
                    Select New Photo
                  </button>
                  {user.profileImage && (
                    <button 
                      className={`${styles.submitBtn} ${styles.profilePhotoBtn} ${styles.profilePhotoBtnDanger}`} 
                      onClick={() => setShowRemoveConfirm(true)}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem 0', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-dark)', marginBottom: '1rem' }}>Are you sure you want to remove your profile photo?</p>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                  <button 
                    className={styles.submitBtn}
                    style={{ flex: 1, maxWidth: '140px', margin: 0, padding: '0.6rem', fontSize: '0.9rem', backgroundColor: '#e2e8f0', color: 'var(--color-dark)' }}
                    onClick={() => setShowRemoveConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className={styles.submitBtn}
                    style={{ flex: 1, maxWidth: '140px', margin: 0, padding: '0.6rem', fontSize: '0.9rem', backgroundColor: '#e53935', color: 'white' }}
                    onClick={async () => {
                      const success = await updateProfile({ profileImage: "" });
                      if(success) {
                        setActiveModal(null);
                        setShowRemoveConfirm(false);
                      }
                    }}
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
