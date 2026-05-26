import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  getMyFiles, 
  downloadFile, 
  deleteFile, 
  recoverFileWithRecoveryKey, 
  recoverFileWithPin,
  shareFile
} from "../services/fileService";
import { isAuthenticated } from "../services/authService";
import ConfirmModal from "../components/ConfirmModal";
import PassphraseModal from "../components/PassphraseModal";
import ShareModal from "../components/ShareModal";

// ─── File icon helper ────────────────────────────────────────────────────────
const getFileIcon = (filename) => {
  const ext = filename?.split(".").pop().toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["zip", "rar", "7z", "tar"].includes(ext)) return "📦";
  if (["mp4", "mov", "avi"].includes(ext)) return "🎬";
  if (["mp3", "wav"].includes(ext)) return "🎵";
  if (["js", "py", "html", "css", "cpp", "java"].includes(ext)) return "💻";
  return "📁";
};

const formatSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Modals
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  
  const [passphraseAction, setPassphraseAction] = useState("DOWNLOAD");
  const [recoveryMode, setRecoveryMode] = useState("key"); // 'key' or 'pin'
  const [recoverySecret, setRecoverySecret] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const navigate = useNavigate();

  const fetchFiles = useCallback(async () => {
    try {
      const data = await getMyFiles();
      setFiles(data);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }
    fetchFiles();
  }, [navigate, fetchFiles]);

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: "", msg: "" }), 5000);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────
  
  const handleDownload = async (passphrase) => {
    setIsProcessing(true);
    setShowPassphrase(false);
    try {
      const { blob, filename } = await downloadFile(selectedFile._id, passphrase, selectedFile.filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      showStatus("success", "File unlocked and downloaded!");
    } catch (err) {
      showStatus("error", err.message || "Could not unlock the file. Please check your phrase.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteFile(selectedFile._id);
      setFiles(files.filter(f => f._id !== selectedFile._id));
      setShowConfirm(false);
      showStatus("success", "File deleted successfully.");
    } catch (err) {
      showStatus("error", "Failed to delete file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async (recipientEmail, senderPassphrase) => {
    try {
      await shareFile(selectedFile._id, recipientEmail, senderPassphrase);
      showStatus("success", `File shared with ${recipientEmail}`);
    } catch (err) {
      throw err; // ShareModal handles error display
    }
  };

  const handleRecovery = async () => {
    if (!recoverySecret) return;
    setIsProcessing(true);
    try {
      let result;
      if (recoveryMode === "key") {
        result = await recoverFileWithRecoveryKey(selectedFile._id, recoverySecret, selectedFile.filename);
      } else {
        result = await recoverFileWithPin(selectedFile._id, recoverySecret, selectedFile.filename);
      }
      
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      setShowRecovery(false);
      setRecoverySecret("");
      showStatus("success", "File recovered!");
    } catch (err) {
      showStatus("error", err.message || "Could not recover the file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  
  const filteredFiles = files.filter(f => 
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .glass-card {
          background: rgba(4, 12, 4, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(0, 255, 100, 0.1);
          border-radius: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .glass-card:hover {
          border-color: rgba(0, 255, 100, 0.3);
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 100, 0.05);
        }
        .action-btn {
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .btn-download { background: rgba(0, 255, 100, 0.1); color: #00ff64; }
        .btn-download:hover { background: rgba(0, 255, 100, 0.2); border-color: rgba(0, 255, 100, 0.4); }
        
        .btn-recover { background: rgba(255, 170, 0, 0.1); color: #ffaa00; }
        .btn-recover:hover { background: rgba(255, 170, 0, 0.2); border-color: rgba(255, 170, 0, 0.4); }
        
        .btn-share { background: rgba(0, 170, 255, 0.1); color: #00aaff; }
        .btn-share:hover { background: rgba(0, 170, 255, 0.2); border-color: rgba(0, 170, 255, 0.4); }
        
        .btn-delete { background: rgba(255, 50, 50, 0.1); color: #ff3232; }
        .btn-delete:hover { background: rgba(255, 50, 50, 0.2); border-color: rgba(255, 50, 50, 0.4); }

        .search-input {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(0, 255, 100, 0.1);
          border-radius: 12px;
          padding: 12px 16px 12px 44px;
          color: #fff;
          width: 300px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input:focus {
          border-color: rgba(0, 255, 100, 0.4);
          background: rgba(0, 255, 100, 0.05);
          box-shadow: 0 0 15px rgba(0, 255, 100, 0.1);
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#030b03", padding: "40px", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
        {/* Background grid */}
        <div style={{ position: "fixed", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(rgba(0,255,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px", zIndex: 0 }} />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", boxShadow: "0 0 20px rgba(0,255,100,0.4)" }}>📁</div>
                <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", fontWeight: "800", color: "#fff", margin: 0 }}>My <span style={{ color: "#00ff64" }}>Files</span></h1>
              </div>
                <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.95rem" }}>
                  View and manage your secured files.
                </p>
            </div>

            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem", color: "rgba(0,255,100,0.4)" }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search files..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Status Toast */}
          <AnimatePresence>
            {status.msg && (
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                style={{
                  position: "fixed", top: "100px", right: "30px", zIndex: 3000,
                  padding: "16px 24px", borderRadius: "12px",
                  background: status.type === "error" ? "rgba(255,50,50,0.95)" : "rgba(0,255,100,0.95)",
                  color: "#000", fontWeight: "700", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  display: "flex", alignItems: "center", gap: "12px"
                }}
              >
                <span>{status.type === "error" ? "❌" : "✅"}</span>
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Files Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <div style={{ width: "40px", height: "40px", border: "3px solid rgba(0,255,100,0.1)", borderTopColor: "#00ff64", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
              <p style={{ color: "rgba(0,255,100,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>Checking your vault...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0", background: "rgba(255,255,255,0.02)", borderRadius: "20px", border: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📭</div>
              <h3 style={{ color: "#fff", fontSize: "1.2rem", marginBottom: "8px" }}>No files found</h3>
              <p style={{ color: "rgba(150,200,150,0.5)" }}>{search ? "Try a different search term." : "Upload your first file!"}</p>
              {!search && <button onClick={() => navigate("/upload")} style={{ marginTop: "24px", padding: "10px 24px", background: "#00ff64", color: "#000", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>Upload Now</button>}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredFiles.map((file, idx) => (
                <motion.div 
                  key={file._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card"
                  style={{ padding: "24px" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
                    <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "rgba(0,255,100,0.05)", border: "1px solid rgba(0,255,100,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>
                      {getFileIcon(file.filename)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ color: "#fff", margin: "0 0 4px 0", fontSize: "1rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={file.filename}>
                        {file.filename}
                      </h4>
                      <div style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>
                        {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                        <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "4px", background: "rgba(0,255,100,0.1)", color: "#00ff64", border: "1px solid rgba(0,255,100,0.2)" }}>Secured</span>
                        {file.version > 1 && <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "4px", background: "rgba(0,170,255,0.1)", color: "#00aaff", border: "1px solid rgba(0,170,255,0.2)" }}>v{file.version}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    <div className="action-btn btn-download" onClick={() => { setSelectedFile(file); setShowPassphrase(true); setPassphraseAction("DOWNLOAD"); }} title="Download & Decrypt">
                      📥
                    </div>
                    <div className="action-btn btn-recover" onClick={() => { setSelectedFile(file); setShowRecovery(true); }} title="Emergency Access">
                      🔑
                    </div>
                    <div className="action-btn btn-share" onClick={() => { setSelectedFile(file); setShowShare(true); }} title="Secure Share">
                      🤝
                    </div>
                    <div className="action-btn btn-delete" onClick={() => { setSelectedFile(file); setShowConfirm(true); }} title="Delete Permanently">
                      🗑️
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* ── MODALS ── */}

        <ConfirmModal 
          isOpen={showConfirm}
          title="Delete File"
          message={`Are you sure you want to permanently delete "${selectedFile?.filename}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          isProcessing={isProcessing}
        />

        <PassphraseModal 
          isOpen={showPassphrase}
          onClose={() => setShowPassphrase(false)}
          onConfirm={handleDownload}
          filename={selectedFile?.filename}
          action={passphraseAction}
        />

        <ShareModal 
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          onShare={handleShare}
          filename={selectedFile?.filename}
        />

        {/* ── RECOVERY MODAL ── */}
        <AnimatePresence>
          {showRecovery && (
            <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isProcessing && setShowRecovery(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} style={{ position: "relative", width: "100%", maxWidth: "480px", background: "#050f05", border: "1px solid #ffaa0044", borderRadius: "24px", padding: "40px", boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(255,170,0,0.05)" }}>
                
                <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#ffaa00", fontSize: "1.6rem", fontWeight: "800", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "2rem" }}>🔑</span> Recovery System
                </h3>
                <p style={{ color: "rgba(255,170,0,0.5)", fontSize: "0.85rem", marginBottom: "32px", fontFamily: "'JetBrains Mono', monospace" }}>
                  File: {selectedFile?.filename}
                </p>

                {/* Tabs */}
                <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "4px", marginBottom: "24px" }}>
                  <div 
                    onClick={() => setRecoveryMode("key")}
                    style={{ flex: 1, textAlign: "center", padding: "10px", borderRadius: "10px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", transition: "all 0.2s", background: recoveryMode === "key" ? "rgba(255,170,0,0.15)" : "transparent", color: recoveryMode === "key" ? "#ffaa00" : "rgba(255,170,0,0.4)" }}
                  >
                    Backup Key
                  </div>
                  <div 
                    onClick={() => {
                      if (selectedFile?.pinWrappedKey) {
                        setRecoveryMode("pin");
                      }
                    }}
                    style={{ 
                      flex: 1, textAlign: "center", padding: "10px", borderRadius: "10px", 
                      cursor: selectedFile?.pinWrappedKey ? "pointer" : "not-allowed", 
                      fontSize: "0.85rem", fontWeight: "700", transition: "all 0.2s", 
                      background: recoveryMode === "pin" ? "rgba(255,170,0,0.15)" : "transparent", 
                      color: recoveryMode === "pin" ? "#ffaa00" : (selectedFile?.pinWrappedKey ? "rgba(255,170,0,0.4)" : "rgba(255,170,0,0.1)") 
                    }}
                  >
                    Security PIN {!selectedFile?.pinWrappedKey && "🚫"}
                  </div>
                </div>

                {!selectedFile?.pinWrappedKey && recoveryMode === "pin" && (
                  <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "12px", padding: "12px", marginBottom: "20px", color: "#ff6b6b", fontSize: "0.8rem", textAlign: "center" }}>
                    This file doesn't have a recovery PIN. You can use your phrase or backup key instead.
                  </div>
                )}

                <div style={{ marginBottom: "32px" }}>
                  <label style={{ display: "block", color: "rgba(255,170,0,0.6)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px", marginBottom: "8px" }}>
                    {recoveryMode === "key" ? "Enter Backup Key" : "Enter 6-digit PIN"}
                  </label>
                  <input 
                    type={recoveryMode === "key" ? "text" : "password"}
                    placeholder={recoveryMode === "key" ? "Enter your key here" : "••••••"}
                    maxLength={recoveryMode === "key" ? 80 : 6}
                    value={recoverySecret}
                    onChange={(e) => setRecoverySecret(e.target.value)}
                    style={{
                      width: "100%", background: "rgba(0,0,0,0.3)", border: "1.5px solid rgba(255,170,0,0.2)",
                      borderRadius: "12px", padding: "14px", color: "#ffaa00", fontSize: "1.1rem",
                      fontFamily: "'JetBrains Mono', monospace", outline: "none", textAlign: recoveryMode === "pin" ? "center" : "left",
                      letterSpacing: recoveryMode === "pin" ? "8px" : "normal"
                    }}
                  />
                  <p style={{ marginTop: "12px", color: "rgba(255,170,0,0.4)", fontSize: "0.75rem", lineHeight: 1.5 }}>
                    {recoveryMode === "key" 
                      ? "The long backup key you saved when you uploaded the file." 
                      : "The 6-digit PIN you set for this file."}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                  <button 
                    disabled={isProcessing}
                    onClick={() => setShowRecovery(false)}
                    style={{ flex: 1, padding: "14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isProcessing || !recoverySecret}
                    onClick={handleRecovery}
                    style={{ 
                      flex: 2, padding: "14px", background: "#ffaa00", color: "#000", border: "none", borderRadius: "12px", 
                      fontSize: "0.9rem", fontWeight: "700", cursor: (isProcessing || !recoverySecret) ? "not-allowed" : "pointer",
                      boxShadow: "0 0 20px rgba(255,170,0,0.3)"
                    }}
                  >
                    {isProcessing ? "Recovering..." : "Get My File"}
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default MyFiles;