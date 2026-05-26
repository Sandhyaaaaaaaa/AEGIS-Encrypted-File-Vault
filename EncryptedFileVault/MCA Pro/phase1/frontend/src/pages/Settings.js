import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, isAuthenticated, logout, generateAndSaveKeys } from "../services/authService";
import api from "../config/api";

// ─── Sidebar Item ──────────────────────────────────────────────────────────────
const SidebarItem = ({ icon, label, active, onClick, badge }) => (
  <motion.div whileHover={{ x: 4 }} onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "11px 16px", borderRadius: "10px", cursor: "pointer",
      background: active ? "rgba(0,255,100,0.1)" : "transparent",
      border: active ? "1px solid rgba(0,255,100,0.2)" : "1px solid transparent",
      marginBottom: "4px", transition: "all 0.2s",
    }}>
    <span style={{ fontSize: "1.1rem" }}>{icon}</span>
    <span style={{ color: active ? "#00ff64" : "rgba(180,220,180,0.6)", fontSize: "0.88rem", fontWeight: active ? "600" : "400", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    {badge && <span style={{ marginLeft: "auto", background: "rgba(0,255,100,0.2)", color: "#00ff64", fontSize: "0.65rem", padding: "2px 7px", borderRadius: "10px", fontFamily: "'JetBrains Mono', monospace" }}>{badge}</span>}
  </motion.div>
);

// ─── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, subtitle, icon, children, delay = 0, borderColor = "rgba(0,255,100,0.1)" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    style={{ background: "rgba(4,12,4,0.8)", border: `1px solid ${borderColor}`, borderRadius: "16px", padding: "28px", marginBottom: "20px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "16px", borderBottom: `1px solid ${borderColor}` }}>
      <span style={{ fontSize: "1.3rem" }}>{icon}</span>
      <div>
        <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700", marginBottom: "2px" }}>{title}</h3>
        <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>{subtitle}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

// ─── Input Field ───────────────────────────────────────────────────────────────
const InputField = ({ label, type = "text", value, onChange, placeholder, disabled = false }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{
        width: "100%", padding: "12px 16px",
        background: disabled ? "rgba(0,255,100,0.02)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "10px", color: disabled ? "rgba(150,200,150,0.4)" : "#e2ffe8",
        fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif",
        outline: "none", transition: "all 0.2s", boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "text",
      }}
      onFocus={(e) => { if (!disabled) { e.target.style.borderColor = "rgba(0,255,100,0.5)"; e.target.style.background = "rgba(0,255,100,0.05)"; } }}
      onBlur={(e) => { e.target.style.borderColor = disabled ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)"; e.target.style.background = disabled ? "rgba(0,255,100,0.02)" : "rgba(255,255,255,0.04)"; }}
    />
  </div>
);

// ─── Alert Box ─────────────────────────────────────────────────────────────────
const AlertBox = ({ message, type }) => {
  if (!message) return null;
  const colors = { success: { bg: "rgba(0,255,100,0.08)", border: "rgba(0,255,100,0.25)", text: "#00ff64", icon: "✅" }, error: { bg: "rgba(255,50,50,0.08)", border: "rgba(255,50,50,0.25)", text: "#ff6b6b", icon: "✗" } };
  const c = colors[type] || colors.error;
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: "8px", padding: "10px 14px", color: c.text, fontSize: "0.82rem", marginBottom: "16px", fontFamily: "'DM Sans', sans-serif" }}>
      {c.icon} {message}
    </motion.div>
  );
};

// ─── OTP Input ─────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);
  const inputs = [];
  const handleKey = (e, i) => {
    if (e.key === "Backspace") {
      const newVal = value.slice(0, i) + value.slice(i + 1);
      onChange(newVal);
      if (i > 0) inputs[i - 1]?.focus();
    } else if (/^\d$/.test(e.key)) {
      const newVal = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6);
      onChange(newVal);
      if (i < 5) inputs[i + 1]?.focus();
    }
  };
  return (
    <div style={{ display: "flex", gap: "8px", margin: "16px 0" }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (inputs[i] = el)} value={d} onChange={() => {}} onKeyDown={(e) => handleKey(e, i)} maxLength={1}
          style={{ width: "44px", height: "52px", textAlign: "center", fontSize: "1.3rem", fontWeight: "700", fontFamily: "'JetBrains Mono', monospace", background: d ? "rgba(0,255,100,0.1)" : "rgba(255,255,255,0.04)", border: d ? "2px solid rgba(0,255,100,0.6)" : "2px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#00ff64", outline: "none", transition: "all 0.2s" }} />
      ))}
    </div>
  );
};

// ─── Main Settings Page ────────────────────────────────────────────────────────
const Settings = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // MFA state
  const [mfaOtp, setMfaOtp] = useState("");
  const [mfaMsg, setMfaMsg] = useState({ text: "", type: "" });
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showMfaConfirm, setShowMfaConfirm] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteMsg, setDeleteMsg] = useState({ text: "", type: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Vault PIN state
  const [vaultPin, setVaultPinVal] = useState("");
  const [pinMsg, setPinMsg] = useState({ text: "", type: "" });
  const [pinLoading, setPinLoading] = useState(false);

  // Security Keys state
  const [keysMsg, setKeysMsg] = useState({ text: "", type: "" });
  const [keysLoading, setKeysLoading] = useState(false);
  const [keysPass, setKeysPass] = useState("");

  // Secret Phrase state
  const [secretPhrase, setSecretPhrase] = useState("");
  const [phraseMsg, setPhraseMsg] = useState({ text: "", type: "" });
  const [phraseLoading, setPhraseLoading] = useState(false);

  const navItems = [
    { icon: "⬛", label: "Dashboard", key: "dashboard", path: "/dashboard" },
    { icon: "📤", label: "Upload File", key: "upload", path: "/upload" },
    { icon: "📁", label: "My Files", key: "files", path: "/myfiles" },
    { icon: "🤖", label: "AI Advisor", key: "ai", path: "/ai-advisor" },
    { icon: "⚙️", label: "Settings", key: "settings", path: "/settings" },
  ];

  if (user?.role === "admin") {
    navItems.push({ icon: "👑", label: "Admin Panel", key: "admin", path: "/admin", badge: "ADMIN" });
  }

  useEffect(() => {
    if (!isAuthenticated()) navigate("/");
  }, [navigate]);

  // ─── Change Password ─────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: "", type: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMsg({ text: "New passwords do not match", type: "error" });
    }
    if (passwordForm.newPassword.length < 6) {
      return setPasswordMsg({ text: "New password must be at least 6 characters", type: "error" });
    }

    setPasswordLoading(true);
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg({ text: "Password changed successfully!", type: "success" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMsg({ text: err.response?.data?.message || "Failed to change password", type: "error" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── Disable MFA ─────────────────────────────────────────────────────────────
  const handleDisableMFA = async () => {
    if (mfaOtp.length !== 6) return setMfaMsg({ text: "Please enter the 6-digit OTP", type: "error" });
    setMfaLoading(true);
    try {
      await api.post("/auth/mfa/disable", { otp: mfaOtp });
      setMfaMsg({ text: "MFA disabled successfully", type: "success" });
      setMfaOtp("");
      setShowMfaConfirm(false);
      // Update local user
      const updatedUser = { ...user, mfaEnabled: false };
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      setMfaMsg({ text: err.response?.data?.message || "Failed to disable MFA", type: "error" });
    } finally {
      setMfaLoading(false);
    }
  };

  // ─── Re-enable MFA ───────────────────────────────────────────────────────────
  const handleEnableMFA = () => {
    navigate("/mfa-setup");
  };

  // ─── Set Vault PIN ───────────────────────────────────────────────────────────
  const handleSetVaultPin = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(vaultPin)) {
      return setPinMsg({ text: "PIN must be 4 to 6 digits", type: "error" });
    }
    setPinLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      await api.post("/auth/vault-pin/set", { pin: vaultPin }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPinMsg({ text: "Vault PIN successfully set!", type: "success" });
      setVaultPinVal("");
    } catch (err) {
      setPinMsg({ text: err.response?.data?.message || "Failed to set Vault PIN", type: "error" });
    } finally {
      setPinLoading(false);
    }
  };

  // ─── Generate Security Keys ──────────────────────────────────────────────────
  const handleGenerateKeys = async (e) => {
    e.preventDefault();
    if (!keysPass) {
      return setKeysMsg({ text: "Please enter your account password to secure your keys", type: "error" });
    }
    setKeysLoading(true);
    setKeysMsg({ text: "Generating new RSA keypair (this may take a moment)...", type: "info" });
    try {
      await generateAndSaveKeys(keysPass);
      setKeysMsg({ text: "RSA keys generated and saved successfully! You can now use secure sharing.", type: "success" });
      setKeysPass("");
    } catch (err) {
      setKeysMsg({ text: err.response?.data?.message || err.message || "Failed to generate keys", type: "error" });
    } finally {
      setKeysLoading(false);
    }
  };

  // ─── Set Secret Phrase ───────────────────────────────────────────────────────
  const handleSetSecretPhrase = async (e) => {
    e.preventDefault();
    if (secretPhrase.length < 4) {
      return setPhraseMsg({ text: "Phrase must be at least 4 characters", type: "error" });
    }
    setPhraseLoading(true);
    try {
      await api.post("/auth/secret-phrase/set", { phrase: secretPhrase });
      setPhraseMsg({ text: "Secret recovery phrase set successfully!", type: "success" });
      setSecretPhrase("");
    } catch (err) {
      setPhraseMsg({ text: err.response?.data?.message || "Failed to set secret phrase", type: "error" });
    } finally {
      setPhraseLoading(false);
    }
  };

  // ─── Delete Account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      return setDeleteMsg({ text: `Please type "${user?.username}" to confirm`, type: "error" });
    }
    setDeleteLoading(true);
    try {
      await api.delete("/auth/delete-account");
      logout();
      navigate("/");
    } catch (err) {
      setDeleteMsg({ text: err.response?.data?.message || "Failed to delete account", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,100,0.2); border-radius: 2px; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #050f05 inset !important; -webkit-text-fill-color: #e2ffe8 !important; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#030b03", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: "240px", minHeight: "100vh", background: "rgba(4,12,4,0.98)", borderRight: "1px solid rgba(0,255,100,0.08)", display: "flex", flexDirection: "column", padding: "24px 16px", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", padding: "0 8px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", boxShadow: "0 0 16px rgba(0,255,100,0.4)" }}>🛡️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: "800", color: "#fff", letterSpacing: "3px" }}>Aegis</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "rgba(0,255,100,0.5)", letterSpacing: "2px" }}>Secure Vault</div>
            </div>
          </div>
          <nav style={{ flex: 1 }}>
            <div style={{ color: "rgba(0,255,100,0.3)", fontSize: "0.62rem", letterSpacing: "2px", fontFamily: "'JetBrains Mono', monospace", padding: "0 8px", marginBottom: "8px" }}>NAVIGATION</div>
            {navItems.map((item) => (
              <SidebarItem key={item.key} icon={item.icon} label={item.label}
                active={item.key === "settings"} badge={item.badge}
                onClick={() => navigate(item.path)} />
            ))}
          </nav>
          <div style={{ borderTop: "1px solid rgba(0,255,100,0.08)", paddingTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "rgba(0,255,100,0.05)", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #00cc44, #00ff64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "700", color: "#000", fontFamily: "'Syne', sans-serif" }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username}</div>
                <div style={{ color: "rgba(0,255,100,0.4)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>{user?.role === "admin" ? "👑 Admin" : "User"}</div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { logout(); navigate("/"); }}
              style={{ width: "100%", padding: "9px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "8px", color: "rgba(255,100,100,0.7)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Sign Out
            </motion.button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ marginLeft: "240px", flex: 1, padding: "32px", maxWidth: "760px" }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.7rem", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
              Account <span style={{ color: "#00ff64" }}>Settings</span>
            </h1>
            <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
              Manage your profile, security and preferences
            </p>
          </motion.div>

          {/* ── PROFILE INFO ── */}
          <SectionCard title="Profile Information" subtitle="Your account details" icon="👤" delay={0}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <InputField label="Username" value={user?.username || ""} disabled placeholder="Your username" />
              <InputField label="Email Address" value={user?.email || ""} disabled placeholder="Your email" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>Role</label>
                <div style={{ padding: "12px 16px", background: "rgba(0,255,100,0.02)", border: "1.5px solid rgba(255,255,255,0.05)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{user?.role === "admin" ? "👑" : "👤"}</span>
                  <span style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.9rem", textTransform: "capitalize" }}>{user?.role || "user"}</span>
                </div>
              </div>
              <div>
                <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>MFA Status</label>
                <div style={{ padding: "12px 16px", background: "rgba(0,255,100,0.02)", border: "1.5px solid rgba(255,255,255,0.05)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: user?.mfaEnabled ? "#00ff64" : "#ff4444", animation: "pulse 2s infinite" }} />
                  <span style={{ color: user?.mfaEnabled ? "#00ff64" : "#ff4444", fontSize: "0.9rem" }}>
                    {user?.mfaEnabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── CHANGE PASSWORD ── */}
          <SectionCard title="Change Password" subtitle="Update your login password" icon="🔑" delay={0.1}>
            <AlertBox message={passwordMsg.text} type={passwordMsg.type} />
            <form onSubmit={handleChangePassword}>
              <InputField label="Current Password" type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="Enter current password" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <InputField label="New Password" type="password" value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password" />
                <InputField label="Confirm New Password" type="password" value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password" />
              </div>
              <motion.button type="submit" disabled={passwordLoading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: passwordLoading ? "rgba(0,255,100,0.1)" : "linear-gradient(90deg, #00cc44, #00ff64)", border: "none", borderRadius: "10px", color: passwordLoading ? "rgba(0,255,100,0.4)" : "#000", fontSize: "0.88rem", fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: passwordLoading ? "not-allowed" : "pointer", letterSpacing: "1px" }}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </motion.button>
            </form>
          </SectionCard>

          {/* ── MFA SETTINGS ── */}
          <SectionCard title="Two-Factor Authentication" subtitle="Manage your MFA settings" icon="🔐" delay={0.2}>
            <AlertBox message={mfaMsg.text} type={mfaMsg.type} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "rgba(0,255,100,0.03)", border: "1px solid rgba(0,255,100,0.08)", borderRadius: "12px", marginBottom: "16px" }}>
              <div>
                <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "600", marginBottom: "4px" }}>Google Authenticator (TOTP)</div>
                <div style={{ color: user?.mfaEnabled ? "#00ff64" : "#ff4444", fontSize: "0.78rem", fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: user?.mfaEnabled ? "#00ff64" : "#ff4444" }} />
                  {user?.mfaEnabled ? "Active and protecting your account" : "Not enabled — your account is less secure"}
                </div>
              </div>
              {user?.mfaEnabled ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowMfaConfirm(!showMfaConfirm)}
                  style={{ padding: "9px 18px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", color: "rgba(255,100,100,0.8)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Disable MFA
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={handleEnableMFA}
                  style={{ padding: "9px 18px", background: "linear-gradient(90deg, #00cc44, #00ff64)", border: "none", borderRadius: "8px", color: "#000", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                  Enable MFA
                </motion.button>
              )}
            </div>

            {/* Disable MFA confirmation */}
            <AnimatePresence>
              {showMfaConfirm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{ padding: "16px", background: "rgba(255,50,50,0.05)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "12px" }}>
                    <p style={{ color: "rgba(200,180,180,0.8)", fontSize: "0.85rem", marginBottom: "8px" }}>Enter your current OTP from Google Authenticator to disable MFA:</p>
                    <OTPInput value={mfaOtp} onChange={setMfaOtp} />
                    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleDisableMFA} disabled={mfaLoading || mfaOtp.length !== 6}
                        style={{ padding: "10px 20px", background: mfaOtp.length === 6 ? "rgba(255,50,50,0.15)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", color: mfaOtp.length === 6 ? "rgba(255,100,100,0.9)" : "rgba(150,150,150,0.4)", fontSize: "0.85rem", cursor: mfaOtp.length === 6 ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                        {mfaLoading ? "Disabling..." : "Confirm Disable"}
                      </motion.button>
                      <button onClick={() => { setShowMfaConfirm(false); setMfaOtp(""); setMfaMsg({ text: "", type: "" }); }}
                        style={{ padding: "10px 20px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "rgba(150,200,150,0.5)", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>

          {/* ── VAULT PIN ── */}
          <SectionCard title="Recovery PIN" subtitle="Set a PIN to recover your account if you lose MFA access" icon="🔑" delay={0.25} borderColor="rgba(0,170,255,0.2)">
            <AlertBox message={pinMsg.text} type={pinMsg.type} />
            <form onSubmit={handleSetVaultPin}>
              <InputField label="New Vault PIN" type="password" value={vaultPin}
                onChange={(e) => setVaultPinVal(e.target.value)}
                placeholder="Enter 4-6 digit PIN" />
              <motion.button type="submit" disabled={pinLoading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: pinLoading ? "rgba(0,170,255,0.1)" : "linear-gradient(90deg, #0088cc, #00aaff)", border: "none", borderRadius: "10px", color: pinLoading ? "rgba(0,170,255,0.4)" : "#fff", fontSize: "0.88rem", fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: pinLoading ? "not-allowed" : "pointer", letterSpacing: "1px" }}>
                {pinLoading ? "Saving..." : "Save Recovery PIN"}
              </motion.button>
            </form>
          </SectionCard>

          {/* ── SECURITY KEYS ── */}
          <SectionCard title="Secure Sharing" subtitle="RSA Keypair for End-to-End Encrypted Sharing" icon="🔐" delay={0.28} borderColor="rgba(167,139,250,0.3)">
            <AlertBox message={keysMsg.text} type={keysMsg.type} />
            <p style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.85rem", marginBottom: "20px" }}>
              Missing your private key? Generate a new RSA keypair to enable secure file sharing. 
              <span style={{ color: "#ffaa00", display: "block", marginTop: "4px" }}>Note: Files shared with your <i>old</i> key will no longer be decryptable if you rotate keys.</span>
            </p>
            <form onSubmit={handleGenerateKeys}>
              <InputField label="Confirm Password" type="password" value={keysPass}
                onChange={(e) => setKeysPass(e.target.value)}
                placeholder="Enter account password to encrypt keys" />
              <motion.button type="submit" disabled={keysLoading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: keysLoading ? "rgba(167,139,250,0.1)" : "linear-gradient(90deg, #8b5cf6, #a78bfa)", border: "none", borderRadius: "10px", color: keysLoading ? "rgba(167,139,250,0.4)" : "#fff", fontSize: "0.88rem", fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: keysLoading ? "not-allowed" : "pointer", letterSpacing: "1px" }}>
                {keysLoading ? "Generating..." : "Enable Secure Sharing"}
              </motion.button>
            </form>
          </SectionCard>

          {/* ── SECRET PHRASE ── */}
          <SectionCard title="Secret Recovery Phrase" subtitle="Backup method to verify your identity" icon="✍️" delay={0.3} borderColor="rgba(0,255,100,0.15)">
            <AlertBox message={phraseMsg.text} type={phraseMsg.type} />
            <form onSubmit={handleSetSecretPhrase}>
              <InputField label="New Secret Phrase" value={secretPhrase}
                onChange={(e) => setSecretPhrase(e.target.value)}
                placeholder="e.g. My favorite childhood book" />
              <motion.button type="submit" disabled={phraseLoading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                style={{ padding: "12px 28px", background: phraseLoading ? "rgba(0,255,100,0.1)" : "linear-gradient(90deg, #00cc44, #00ff64)", border: "none", borderRadius: "10px", color: phraseLoading ? "rgba(0,255,100,0.4)" : "#000", fontSize: "0.88rem", fontWeight: "700", fontFamily: "'Syne', sans-serif", cursor: phraseLoading ? "not-allowed" : "pointer", letterSpacing: "1px" }}>
                {phraseLoading ? "Saving..." : "Save Phrase"}
              </motion.button>
            </form>
          </SectionCard>

          {/* ── DANGER ZONE ── */}
          <SectionCard title="Danger Zone" subtitle="Irreversible actions — proceed with caution" icon="⚠️" delay={0.3} borderColor="rgba(255,50,50,0.2)">
            <AlertBox message={deleteMsg.text} type={deleteMsg.type} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", background: "rgba(255,50,50,0.04)", border: "1px solid rgba(255,50,50,0.12)", borderRadius: "12px", marginBottom: "16px" }}>
              <div>
                <div style={{ color: "#fff", fontSize: "0.9rem", fontWeight: "600", marginBottom: "4px" }}>Delete Account</div>
                <div style={{ color: "rgba(200,150,150,0.6)", fontSize: "0.78rem" }}>Permanently delete your account and all your files. This cannot be undone.</div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                style={{ padding: "9px 18px", background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", color: "rgba(255,100,100,0.8)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap", marginLeft: "16px" }}>
                Delete Account
              </motion.button>
            </div>

            <AnimatePresence>
              {showDeleteConfirm && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{ padding: "16px", background: "rgba(255,50,50,0.05)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "12px" }}>
                    <p style={{ color: "rgba(200,150,150,0.8)", fontSize: "0.85rem", marginBottom: "12px" }}>
                      Type <strong style={{ color: "#ff6b6b" }}>{user?.username}</strong> to confirm deletion:
                    </p>
                    <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
                      placeholder={`Type "${user?.username}" to confirm`}
                      style={{ width: "100%", padding: "11px 14px", background: "rgba(255,50,50,0.05)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "8px", color: "#e2ffe8", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} />
                    <div style={{ display: "flex", gap: "10px" }}>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleDeleteAccount} disabled={deleteLoading}
                        style={{ padding: "10px 20px", background: deleteConfirm === user?.username ? "rgba(255,50,50,0.2)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,50,50,0.4)", borderRadius: "8px", color: deleteConfirm === user?.username ? "#ff6b6b" : "rgba(150,150,150,0.4)", fontSize: "0.85rem", cursor: deleteConfirm === user?.username ? "pointer" : "not-allowed", fontFamily: "'DM Sans', sans-serif" }}>
                        {deleteLoading ? "Deleting..." : "Confirm Delete"}
                      </motion.button>
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(""); setDeleteMsg({ text: "", type: "" }); }}
                        style={{ padding: "10px 20px", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "rgba(150,200,150,0.5)", fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SectionCard>
        </div>
      </div>
    </>
  );
};

export default Settings;