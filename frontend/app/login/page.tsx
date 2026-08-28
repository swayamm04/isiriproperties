"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Phone, Lock, User, MapPin } from "lucide-react";
import { useAuth } from "@/context/authContext";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode") as "login" | "signup" | "forgot_password" | null;

  const { 
    user, 
    login, 
    signup, 
    error, 
    clearError, 
    sendOtp,
    forgotPassword
  } = useAuth();

  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot_password">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const OTP_ENABLED = false; // Toggle this to enable/disable OTP verification

  // Form states
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (modeParam && ["login", "signup", "forgot_password"].includes(modeParam)) {
      setAuthMode(modeParam);
    }
  }, [modeParam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (validationError || successMessage || error) {
      timer = setTimeout(() => {
        setValidationError("");
        setSuccessMessage("");
        clearError();
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [validationError, successMessage, error, clearError]);

  const switchMode = (mode: "login" | "signup" | "forgot_password") => {
    setAuthMode(mode);
    setValidationError("");
    setSuccessMessage("");
    clearError();
    setShowPassword(false);
    setOtp("");
    setOtpSent(false);
    router.replace(`/login?mode=${mode}`);
  };


  const handleSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMessage("");
    if (!phone || phone.length < 10) {
      setValidationError("Please enter a valid 10-digit phone number.");
      return;
    }
    setAuthLoading(true);
    try {
      await sendOtp(phone, authMode);
      setOtpSent(true);
      setSuccessMessage("OTP sent successfully!");
    } catch {
      // Errors handled by context
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    setSuccessMessage("");
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        if (!phone || !password) {
          setValidationError("Phone Number and Password are required.");
          setAuthLoading(false);
          return;
        }
        await login(phone, password);
        router.push("/");
      } else if (authMode === "signup") {
        if (OTP_ENABLED && (!name || !phone || !password || !otp)) {
          setValidationError("All fields and OTP are required.");
          setAuthLoading(false);
          return;
        } else if (!OTP_ENABLED && (!name || !phone || !password)) {
          setValidationError("All fields are required.");
          setAuthLoading(false);
          return;
        }
        await signup({ name, phone, password, otp: OTP_ENABLED ? otp : "000000" });
        router.push("/");
      } else if (authMode === "forgot_password") {
        if (OTP_ENABLED && (!phone || !otp || !password)) {
          setValidationError("Phone, OTP, and New Password are required.");
          setAuthLoading(false);
          return;
        } else if (!OTP_ENABLED && (!phone || !password)) {
          setValidationError("Phone and New Password are required.");
          setAuthLoading(false);
          return;
        }
        await forgotPassword(phone, OTP_ENABLED ? otp : "000000", password);
        switchMode("login");
        setPassword("");
        setSuccessMessage("Password updated successfully. Please login.");
      }
    } catch {
      // Errors handled by context
    } finally {
      setAuthLoading(false);
    }
  };

  const renderOtpInputs = () => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          id={`otp-${index}`}
          type="text"
          maxLength={1}
          value={otp[index] || ""}
          onChange={(e) => {
            const value = e.target.value;
            if (!/^[0-9]*$/.test(value)) return;
            const newOtp = otp.split('');
            while (newOtp.length < 6) newOtp.push('');
            newOtp[index] = value;
            setOtp(newOtp.join(''));
            if (value && index < 5) {
              const nextInput = document.getElementById(`otp-${index + 1}`);
              nextInput?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !otp[index] && index > 0) {
              const prevInput = document.getElementById(`otp-${index - 1}`);
              prevInput?.focus();
            }
          }}
          className={styles.inputField}
          style={{ width: '45px', height: '45px', textAlign: 'center', padding: '0', fontSize: '1.2rem', borderRadius: '4px' }}
          required
        />
      ))}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.title}>
          {authMode === "login" ? "Welcome Back!" : authMode === "signup" ? "Create Account" : "Reset Password"}
        </h2>
        <p className={styles.subtitle}>
          {authMode === "login" ? "Login to continue to Plot&Acre" : authMode === "signup" ? "Register to start your property wishlist" : "Enter your registered phone number to reset password"}
        </p>

        <form onSubmit={handleAuthSubmit}>
          {validationError && <div className={styles.errorMsg}>{validationError}</div>}
          {successMessage && <div className={styles.successMsg}>{successMessage}</div>}
          {error && !validationError && <div className={styles.errorMsg}>{error}</div>}

          {authMode === "signup" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={18} className={styles.inputIcon} />
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className={styles.inputField} required />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input type="tel" pattern="[6-9][0-9]{9}" title="10-digit mobile number starting with 6-9" maxLength={10} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={styles.inputField} required disabled={OTP_ENABLED && otpSent} />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: "1.5rem" }}>
                <label className={styles.formLabel}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input type={showPassword ? "text" : "password"} placeholder="Create Password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.inputField} style={{ paddingRight: "3rem" }} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "1rem", background: "none", border: "none", color: "var(--color-dark-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} style={{ strokeWidth: 1.5 }} /> : <Eye size={18} style={{ strokeWidth: 1.5 }} />}
                  </button>
                </div>
              </div>

              {OTP_ENABLED && otpSent && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} style={{ textAlign: "center", display: "block" }}>Enter OTP</label>
                  {renderOtpInputs()}
                </div>
              )}
            </>
          )}

          {authMode === "forgot_password" && (
            <>
              {(!OTP_ENABLED || !otpSent) ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Registered Phone Number</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Phone size={18} className={styles.inputIcon} />
                    <input type="tel" pattern="[6-9][0-9]{9}" title="10-digit mobile number starting with 6-9" maxLength={10} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={styles.inputField} required />
                  </div>
                </div>
              ) : null}
              
              {(OTP_ENABLED && otpSent) && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} style={{ textAlign: "center", display: "block" }}>Enter OTP</label>
                    {renderOtpInputs()}
                  </div>
              )}

              {(!OTP_ENABLED || otpSent) && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>New Password</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Lock size={18} className={styles.inputIcon} />
                      <input type={showPassword ? "text" : "password"} placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.inputField} style={{ paddingRight: "3rem" }} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "1rem", background: "none", border: "none", color: "var(--color-dark-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff size={18} style={{ strokeWidth: 1.5 }} /> : <Eye size={18} style={{ strokeWidth: 1.5 }} />}
                      </button>
                    </div>
                  </div>
              )}
            </>
          )}

          {authMode === "login" && (
            <>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input type="tel" pattern="[6-9][0-9]{9}" title="10-digit mobile number starting with 6-9" maxLength={10} placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} className={styles.inputField} required />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: "0.5rem" }}>
                <label className={styles.formLabel}>Password</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.inputField} style={{ paddingRight: "3rem" }} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "1rem", background: "none", border: "none", color: "var(--color-dark-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={18} style={{ strokeWidth: 1.5 }} /> : <Eye size={18} style={{ strokeWidth: 1.5 }} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button type="button" onClick={() => switchMode("forgot_password")} className={styles.switchBtn}>
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          <button
            type={authMode === "login" || (authMode === "signup" && (!OTP_ENABLED || otpSent)) || (authMode === "forgot_password" && (!OTP_ENABLED || otpSent)) ? "submit" : "button"}
            className={styles.submitBtn}
            disabled={authLoading}
            onClick={
              authMode === "signup" && OTP_ENABLED && !otpSent ? handleSendOtp :
                authMode === "forgot_password" && OTP_ENABLED && !otpSent ? handleSendOtp :
                    undefined
            }
          >
            {authLoading ? "Please wait..." :
              authMode === "login" ? "Login" :
                authMode === "signup" && OTP_ENABLED && !otpSent ? "Send OTP" :
                  authMode === "signup" ? "Create Account" :
                      authMode === "forgot_password" && OTP_ENABLED && !otpSent ? "Send OTP" :
                        "Reset Password"}
          </button>
        </form>

        <div className={styles.switchText}>
          {authMode === "login" ? (
            <>
              Don't have an account?
              <button
                onClick={() => switchMode("signup")}
                className={styles.switchBtn}
                type="button"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Old user?
              <button
                onClick={() => switchMode("login")}
                className={styles.switchBtn}
                type="button"
              >
                Login here
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>Loading...</div>}>
        <LoginContent />
      </Suspense>
      <Footer />
    </>
  );
}
