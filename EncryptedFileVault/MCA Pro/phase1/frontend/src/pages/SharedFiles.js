import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSharedFiles, downloadSharedFile } from "../services/fileService";
import { isAuthenticated } from "../services/authService";
import api from "../config/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getFileIcon = (filename) => {
  const ext = filename?.split(".").pop().toLowerCase() || "";
  if (["pdf"].includes(ext)) return "📄";
  if (["jpg","jpeg","png","gif","svg","webp"].includes(ext)) return "🖼️";
  if (["mp4","mov","avi","webm","mkv"].includes(ext)) return "🎬";
  if (["mp3","wav","ogg","flac"].includes(ext)) return "🎵";
  if (["doc","docx","txt","rtf","md"].includes(ext)) return "📝";
  if (["xls","xlsx","csv"].includes(ext)) return "📊";
  if (["zip","rar","7z","tar","gz"].includes(ext)) return "🗜️";
  if (["js","jsx","ts","tsx","html","css","json","py","java","c","cpp","go"].includes(ext)) return "💻";
  return "📁";
};

const formatSize = (bytes) => {
  if (!bytes) return "0 KB";
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
};

const timeAgo = (date) => {
  if (!date) return "Unknown";
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

// ─── Expiry Helpers ──────────────────────────────────────────────────────────
const getExpiryInfo = (expiresAt) => {
  if (!expiresAt) return { label: "Never expires", color: "#00ff64", bg: "rgba(0,255,100,0.08)", border: "rgba(0,255,100,0.2)", icon: "∞" };
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  const daysLeft = Math.ceil((exp - now) / 86400000);
  if (daysLeft <= 0) return { label: "Expired", color: "#ff4444", bg: "rgba(255,68,68,0.1)", border: "rgba(255,68,68,0.3)", icon: "✕" };
  if (daysLeft <= 3) return { label: `Expires in ${daysLeft}d`, color: "#ff4444", bg: "rgba(255,68,68,0.08)", border: "rgba(255,68,68,0.2)", icon: "⏰" };
  if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, color: "#ffaa00", bg: "rgba(255,170,0,0.08)", border: "rgba(255,170,0,0.2)", icon: "⏳" };
  return { label: `${daysLeft} days left`, color: "#00ff64", bg: "rgba(0,255,100,0.08)", border: "rgba(0,255,100,0.2)", icon: "✓" };
};

// ─── Modal Component ─────────────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, icon, borderColor, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ position: "relative", width: "100%", maxWidth: "500px", margin: "16px", background: "rgba(4,12,4,0.98)", borderRadius: "16px",
            border: `1px solid ${borderColor}`, boxShadow: `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px ${borderColor}30`,
            overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${borderColor}20`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.2rem" }}>{icon}</span>
              <h2 style={{ margin: 0, color: "#e2ffe8", fontSize: "1.1rem", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{title}</h2>
            </div>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(150,200,150,0.6)", fontSize: "1.2rem", cursor: "pointer", padding: "4px" }}>✕</button>
          </div>
          <div style={{ padding: "24px" }}>{children}</div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast = ({ message, visible }) => (
  <AnimatePresence>
    {visible && (
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        style={{ position: "fixed", bottom: "32px", left: "50%", transform: "translateX(-50%)", zIndex: 2000, padding: "14px 24px", background: "rgba(0,255,100,0.15)", border: "1px solid rgba(0,255,100,0.4)", borderRadius: "12px", color: "#00ff64", fontWeight: "700", fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif", backdropFilter: "blur(8px)", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "10px" }}>
        <span>✅</span> {message}
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const SharedFiles = () => {
  const [activeTab, setActiveTab] = useState("received");

  // Files data
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialogs
  const [downloadDialog, setDownloadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [revokeDialog, setRevokeDialog] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);

  // Toast
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { window.location.href = "/"; return; }
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const [receivedRes, sentRes] = await Promise.all([
        getSharedFiles(),
        api.get("/files/shared-by-me")
      ]);
      
      setReceivedFiles(receivedRes);
      setSentFiles(sentRes.data);
    } catch (err) { 
      setError("Failed to load shared files."); 
    } finally { 
      setLoading(false); 
    }
  };

  const closeDialogs = () => {
    if (actionLoading) return;
    setDownloadDialog(false); setRevokeDialog(false);
    setPassword(""); setStatusMessage({ text: "", type: "" }); setShowPassword(false);
  };

  const handleDownload = async () => {
    if (!password.trim()) { setStatusMessage({ text: "Please enter your account password", type: "error" }); return; }
    console.log("[Debug] Attempting to download shared file:", selectedFile?._id);
    setActionLoading(true); setStatusMessage({ text: "Decrypting your shared file...", type: "info" });
    try {
      const result = await downloadSharedFile(selectedFile._id, selectedFile.wrappedKey, password, selectedFile.filename);
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement("a"); link.href = url; link.download = result.filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
      setStatusMessage({ text: "File unlocked and downloaded!", type: "success" });
      setTimeout(closeDialogs, 2000);
    } catch (err) { 
      const serverMsg = err.response?.data?.message;
      let finalMsg = serverMsg || err.message || "Could not unlock the file.";
      if (serverMsg === "Private key not found" || err.message?.includes("registered RSA private key")) {
        finalMsg = "Security keys not found. Please go to Settings and create your security keys first.";
      }
      setStatusMessage({ text: finalMsg, type: "error" }); 
    }
    finally { setActionLoading(false); }
  };

  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/files/share/${revokeTarget._id}`);
      setSentFiles(prev => prev.filter(f => f._id !== revokeTarget._id));
      closeDialogs();
      showToast("Access removed successfully");
    } catch (err) {
      alert("Failed to revoke access: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const inputStyle = { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: "8px", padding: "12px 14px", color: "#e2ffe8", fontSize: "0.95rem", fontFamily: "'JetBrains Mono', monospace", outline: "none", transition: "all 0.2s" };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:focus { border-color: #00ff64 !important; box-shadow: 0 0 0 2px rgba(0,255,100,0.1) !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,100,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#030b03", padding: "40px", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
        <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,255,100,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.06) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "32px" }}>
            <h1 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "2.2rem", fontWeight: 800, margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ color: "#a78bfa" }}>🔗</span> Secure Sharing
            </h1>
            <p style={{ color: "rgba(150,200,150,0.6)", margin: 0, fontSize: "1rem" }}>Safely share files with your friends using our secure system.</p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ display: "flex", gap: "4px", marginBottom: "32px", background: "rgba(6,16,6,0.8)", borderRadius: "12px", padding: "4px", border: "1px solid rgba(0,255,100,0.08)", width: "fit-content" }}>
            {[
              { key: "received", label: "Received", count: receivedFiles.length, icon: "📥" },
              { key: "sent", label: "Sent", count: sentFiles.length, icon: "📤" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 24px", borderRadius: "10px", border: "none",
                  background: activeTab === tab.key
                    ? tab.key === "received" ? "rgba(167,139,250,0.15)" : "rgba(0,170,255,0.15)"
                    : "transparent",
                  color: activeTab === tab.key
                    ? tab.key === "received" ? "#a78bfa" : "#00aaff"
                    : "rgba(150,200,150,0.5)",
                  cursor: "pointer", fontSize: "0.92rem", fontWeight: activeTab === tab.key ? "700" : "500",
                  fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s",
                }}>
                <span>{tab.icon}</span>
                {tab.label}
                <span style={{ padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "700", fontFamily: "'JetBrains Mono', monospace",
                  background: activeTab === tab.key ? (tab.key === "received" ? "rgba(167,139,250,0.2)" : "rgba(0,170,255,0.2)") : "rgba(255,255,255,0.05)",
                  color: activeTab === tab.key ? (tab.key === "received" ? "#a78bfa" : "#00aaff") : "rgba(150,200,150,0.4)" }}>{tab.count}</span>
              </button>
            ))}
          </motion.div>

          {/* Error Message */}
          {error && <div style={{ padding: "16px", background: "rgba(255,68,68,0.1)", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "12px", color: "#ff4444", marginBottom: "24px" }}>{error}</div>}

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px" }}>
              <div style={{ width: "48px", height: "48px", border: "3px solid rgba(0,255,100,0.2)", borderTop: "3px solid #00ff64", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ color: "rgba(0,255,100,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>Checking shared files...</p>
            </div>
          ) : (
            <>
              {activeTab === "received" ? (
                receivedFiles.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", padding: "80px 20px", background: "rgba(4,12,4,0.8)", border: "1px solid rgba(167,139,250,0.1)", borderRadius: "16px" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "20px", opacity: 0.5 }}>📭</div>
                    <h2 style={{ color: "#e2ffe8", fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: "0 0 12px 0" }}>No files shared with you</h2>
                    <p style={{ color: "rgba(150,200,150,0.5)", maxWidth: "400px", margin: "0 auto" }}>Files shared with you will appear here.</p>
                  </motion.div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "20px" }}>
                    <AnimatePresence>
                      {receivedFiles.map((file, i) => {
                        const exp = getExpiryInfo(file.expiresAt);
                        return (
                          <motion.div key={file._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ background: "rgba(6,16,6,0.9)", border: "1px solid rgba(167,139,250,0.12)", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
                              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{getFileIcon(file.filename)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#e2ffe8", fontWeight: "600", fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.filename}</div>
                                <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.78rem" }}>{formatSize(file.size)}</div>
                              </div>
                            </div>
                            <div style={{ padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", marginBottom: "14px" }}>
                              <div style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.65rem", textTransform: "uppercase", marginBottom: "2px" }}>Sender</div>
                              <div style={{ color: "#a78bfa", fontSize: "0.85rem", fontWeight: "600" }}>{file.sender?.username || "Unknown"}</div>
                              <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.7rem" }}>{file.sender?.email}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
                              <span style={{ padding: "2px 8px", background: exp.bg, color: exp.color, border: `1px solid ${exp.border}`, borderRadius: "20px", fontSize: "0.65rem" }}>{exp.icon} {exp.label}</span>
                            </div>
                            <button onClick={() => { setSelectedFile(file); setDownloadDialog(true); }} disabled={exp.label === "Expired"} style={{ width: "100%", padding: "10px", background: exp.label === "Expired" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00ff64, #00cc44)", color: exp.label === "Expired" ? "rgba(255,255,255,0.2)" : "#030b03", border: "none", borderRadius: "10px", cursor: exp.label === "Expired" ? "not-allowed" : "pointer", fontWeight: "700" }}>Unlock & Download</button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              ) : (
                sentFiles.length === 0 ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: "center", padding: "80px 20px", background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,170,255,0.1)", borderRadius: "16px" }}>
                    <div style={{ fontSize: "4rem", marginBottom: "20px", opacity: 0.5 }}>📤</div>
                    <h2 style={{ color: "#e2ffe8", fontFamily: "'Syne', sans-serif", fontWeight: 700, margin: "0 0 12px 0" }}>No sent shares</h2>
                    <p style={{ color: "rgba(150,200,150,0.5)", maxWidth: "400px", margin: "0 auto" }}>Share files from your vault to see them here.</p>
                  </motion.div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "20px" }}>
                    <AnimatePresence>
                      {sentFiles.map((file, i) => {
                        const exp = getExpiryInfo(file.expiresAt);
                        return (
                          <motion.div key={file._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            style={{ background: "rgba(6,16,6,0.9)", border: "1px solid rgba(0,170,255,0.12)", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "16px" }}>
                              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(0,170,255,0.05)", border: "1px solid rgba(0,170,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>{getFileIcon(file.filename)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#e2ffe8", fontWeight: "600", fontSize: "1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.filename}</div>
                                <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.78rem" }}>Sent {timeAgo(file.sharedAt)}</div>
                              </div>
                            </div>
                            <div style={{ padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "8px", marginBottom: "14px" }}>
                              <div style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.65rem", textTransform: "uppercase", marginBottom: "2px" }}>Recipient</div>
                              <div style={{ color: "#00aaff", fontSize: "0.85rem", fontWeight: "600" }}>{file.recipient}</div>
                            </div>
                            <div style={{ display: "flex", gap: "6px", marginBottom: "18px" }}>
                              <span style={{ padding: "2px 8px", background: exp.bg, color: exp.color, border: `1px solid ${exp.border}`, borderRadius: "20px", fontSize: "0.65rem" }}>{exp.icon} {exp.label}</span>
                            </div>
                            <button onClick={() => { setRevokeTarget(file); setRevokeDialog(true); }} style={{ width: "100%", padding: "10px", background: "rgba(255,68,68,0.1)", color: "#ff4444", border: "1px solid rgba(255,68,68,0.3)", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>Remove Access</button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Download Modal */}
      <Modal isOpen={downloadDialog} onClose={closeDialogs} title="Unlock Shared File" icon="🔐" borderColor="rgba(0,255,100,0.3)">
        <div style={{ marginBottom: "20px", position: "relative" }}>
          <input type={showPassword ? "text" : "password"} placeholder="Your Account Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={actionLoading} style={inputStyle} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#00ff64", cursor: "pointer", fontWeight: "600", fontSize: "0.82rem" }}>{showPassword ? "Hide" : "Show"}</button>
        </div>
        {statusMessage.text && <div style={{ padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", background: statusMessage.type === "error" ? "rgba(255,68,68,0.1)" : "rgba(0,255,100,0.1)", color: statusMessage.type === "error" ? "#ff4444" : "#00ff64" }}>{statusMessage.text}</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={closeDialogs} disabled={actionLoading} style={{ background: "transparent", border: "none", color: "rgba(150,200,150,0.6)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleDownload} disabled={actionLoading || !password} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "700", background: "linear-gradient(135deg, #00ff64, #00cc44)", color: "#030b03", cursor: "pointer" }}>{actionLoading ? "Unlocking..." : "Unlock & Get"}</button>
        </div>
      </Modal>

      {/* Revoke Modal */}
      <Modal isOpen={revokeDialog} onClose={closeDialogs} title="Remove Access" icon="🚫" borderColor="rgba(255,68,68,0.3)">
        <p style={{ color: "rgba(150,200,150,0.8)", margin: "0 0 24px 0" }}>Stop sharing with <strong>{revokeTarget?.recipient}</strong>? They will no longer be able to open this file.</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button onClick={closeDialogs} disabled={actionLoading} style={{ background: "transparent", border: "none", color: "rgba(150,200,150,0.6)", cursor: "pointer" }}>Cancel</button>
          <button onClick={handleRevoke} disabled={actionLoading} style={{ padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "700", background: "rgba(255,68,68,0.2)", color: "#ff4444", cursor: "pointer" }}>{actionLoading ? "Removing..." : "Remove Now"}</button>
        </div>
      </Modal>

      <Toast message={toast.message} visible={toast.visible} />
    </>
  );
};

export default SharedFiles;
