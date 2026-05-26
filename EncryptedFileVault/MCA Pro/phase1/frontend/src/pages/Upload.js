import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFile } from "../services/fileService";
import { isAuthenticated } from "../services/authService";
import { validateKeyStrength, generateStrongKey } from "../utils/keyValidator";

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState("");
  const [vaultPin, setVaultPin] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState(0); // 1: Starting, 2: Checking File, 3: Locking, 4: Uploading
  const [status, setStatus] = useState({ type: "", msg: "" });
  
  // Success state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generatedRecoveryKey, setGeneratedRecoveryKey] = useState("");
  const [hasConfirmedKeySave, setHasConfirmedKeySave] = useState(false);

  const navigate = useNavigate();

  // ─── Event Handlers ────────────────────────────────────────────────────────

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !encryptionKey) return;

    if (vaultPin && vaultPin.length !== 6) {
      setStatus({ type: "error", msg: "Recovery PIN should be 6 digits." });
      return;
    }

    setIsUploading(true);
    setStatus({ type: "", msg: "" });
    
    try {
      // stage change callback passed to service
      const result = await uploadFile(
        selectedFile, 
        encryptionKey, 
        vaultPin || null,
        (stage) => setUploadStage(stage)
      );

      setGeneratedRecoveryKey(result.recoveryKey);
      setShowSuccessModal(true);
      
      // Cleanup for next upload
      setSelectedFile(null);
      setEncryptionKey("");
      setVaultPin("");
      setUploadStage(0);
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Upload failed. Please try again." });
      setUploadStage(0);
    } finally {
      setIsUploading(false);
    }
  };

  const copyRecoveryKey = () => {
    navigator.clipboard.writeText(generatedRecoveryKey);
    setStatus({ type: "success", msg: "Recovery Key copied to clipboard!" });
    setTimeout(() => setStatus({ type: "", msg: "" }), 3000);
  };

  const downloadRecoveryKey = () => {
    const element = document.createElement("a");
    const file = new Blob([
      `AEGIS VAULT RECOVERY KEY\nFile: ${generatedRecoveryKey}\nKey: ${generatedRecoveryKey}\n\nKEEP THIS SECURE. IF YOU LOSE THIS, YOU CANNOT GET YOUR FILE BACK.`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "AEGIS_Recovery_Key.txt";
    document.body.appendChild(element);
    element.click();
  };

  // ─── UI Helpers ────────────────────────────────────────────────────────────

  const keyStats = validateKeyStrength(encryptionKey);
  const stageLabels = ["Starting", "Checking File", "Locking Data", "Saving Key", "Uploading"];

  if (!isAuthenticated()) {
    navigate("/");
    return null;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .upload-area {
          border: 2px dashed rgba(0, 255, 100, 0.2);
          border-radius: 20px;
          padding: 60px 40px;
          text-align: center;
          background: rgba(0, 255, 100, 0.02);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .upload-area.active {
          border-color: #00ff64;
          background: rgba(0, 255, 100, 0.08);
          box-shadow: inset 0 0 40px rgba(0, 255, 100, 0.1);
        }
        .upload-area:hover {
          border-color: rgba(0, 255, 100, 0.5);
        }
        
        .field-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 16px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .field-input:focus {
          border-color: rgba(0, 255, 100, 0.4);
          background: rgba(0, 255, 100, 0.05);
        }

        .pin-input {
          letter-spacing: 8px;
          text-align: center;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.2rem;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        .pulsing { animation: pulse 2s infinite; }
        
        .progress-bar {
          height: 4px;
          background: rgba(0, 255, 100, 0.1);
          border-radius: 2px;
          overflow: hidden;
          margin: 20px 0;
        }
        .progress-fill {
          height: 100%;
          background: #00ff64;
          transition: width 0.5s ease;
          box-shadow: 0 0 10px #00ff64;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#030b03", padding: "60px 20px", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", boxShadow: "0 0 20px rgba(0,255,100,0.4)" }}>📤</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.8rem", fontWeight: "800", color: "#fff", margin: 0 }}>Upload & <span style={{ color: "#00ff64" }}>Encrypt</span></h1>
            </div>
            <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "1.1rem" }}>Completely secure — your password stays on your device.</p>
          </motion.div>

          <form onSubmit={handleUpload}>
            {/* File Dropzone */}
            <div 
              className={`upload-area ${dragActive ? "active" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input").click()}
              style={{ marginBottom: "32px" }}
            >
              <input id="file-input" type="file" style={{ display: "none" }} onChange={handleFileChange} />
              {selectedFile ? (
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                  <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📄</div>
                  <h3 style={{ color: "#00ff64", marginBottom: "8px" }}>{selectedFile.name}</h3>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>{(selectedFile.size / 1024).toFixed(2)} KB • Ready to upload</p>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} style={{ marginTop: "16px", background: "rgba(255,50,50,0.1)", color: "#ff3232", border: "1px solid rgba(255,50,50,0.2)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem" }}>Remove</button>
                </motion.div>
              ) : (
                <>
                  <div style={{ fontSize: "3.5rem", marginBottom: "20px", opacity: 0.6 }}>📥</div>
                  <h3 style={{ color: "#fff", fontSize: "1.2rem", fontWeight: "600", marginBottom: "12px" }}>Drop your file here</h3>
                  <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.9rem" }}>or click anywhere to browse your computer</p>
                  <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "24px" }}>
                    {["Documents", "Images", "Archives", "Code"].map(t => (
                      <span key={t} style={{ fontSize: "0.7rem", padding: "4px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}>{t}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Passphrase & PIN Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "20px", marginBottom: "32px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ color: "rgba(0, 255, 100, 0.6)", fontSize: "0.8rem", fontWeight: "700", letterSpacing: "1px" }}>Secret Phrase</label>
                  <span onClick={() => setEncryptionKey(generateStrongKey())} style={{ color: "#00aaff", fontSize: "0.7rem", cursor: "pointer", fontWeight: "700" }}>Help me choose</span>
                </div>
                <div style={{ position: "relative" }}>
                  <input 
                    type={showKey ? "text" : "password"}
                    className="field-input"
                    placeholder="Enter a secret phrase to lock the file"
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    required
                  />
                  <span onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "rgba(0,255,100,0.4)", fontSize: "0.8rem", fontWeight: "700" }}>{showKey ? "Hide" : "Show"}</span>
                </div>
                {/* Strength Meter */}
                {encryptionKey && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= (keyStats.score / 20) ? keyStats.color : "rgba(255,255,255,0.05)", transition: "all 0.3s" }} />
                      ))}
                    </div>
                    <p style={{ color: keyStats.color, fontSize: "0.75rem", fontWeight: "600", margin: 0 }}>{keyStats.strength.toUpperCase()}: {keyStats.feedback[0]}</p>
                  </div>
                )}
            </div>
            {/* Vault PIN Recovery */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ color: "rgba(0, 255, 100, 0.5)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px" }}>Recovery PIN (Optional)</label>
                <div style={{ fontSize: "0.7rem", color: "#ffaa00", fontFamily: "'JetBrains Mono', monospace", background: "rgba(255,170,0,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                  Extra safety
                </div>
              </div>
              <input 
                type="password" 
                placeholder="6-digit PIN for emergency access" 
                maxLength={6}
                className="field-input"
                value={vaultPin}
                onChange={(e) => setVaultPin(e.target.value.replace(/\D/g, ""))}
              />
              <p style={{ color: "rgba(150, 200, 150, 0.35)", fontSize: "0.7rem", marginTop: "8px", lineHeight: "1.4" }}>
                If you set a PIN, you can use it to get your file back if you forget your secret phrase.
              </p>
            </div>
            </div>

            {/* Action Area */}
            <div style={{ textAlign: "center" }}>
              <AnimatePresence>
                {isUploading && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: "24px" }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(uploadStage / 4) * 100}%` }} />
                    </div>
                    <p style={{ color: "#00ff64", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }} className="pulsing">> {stageLabels[uploadStage] || "Processing"}...</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {status.msg && (
                <div style={{ padding: "12px", borderRadius: "8px", background: status.type === "error" ? "rgba(255,50,50,0.1)" : "rgba(0,255,100,0.1)", border: `1px solid ${status.type === "error" ? "rgba(255,50,50,0.2)" : "rgba(0,255,100,0.2)"}`, color: status.type === "error" ? "#ff4444" : "#00ff64", fontSize: "0.9rem", marginBottom: "20px" }}>
                  {status.msg}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isUploading || !selectedFile || !encryptionKey}
                style={{
                  width: "100%", padding: "18px", borderRadius: "14px", border: "none",
                  background: (isUploading || !selectedFile || !encryptionKey) ? "rgba(255,255,255,0.05)" : "linear-gradient(90deg, #00cc44, #00ff64)",
                  color: (isUploading || !selectedFile || !encryptionKey) ? "rgba(255,255,255,0.2)" : "#000",
                  fontSize: "1rem", fontWeight: "800", fontFamily: "'Syne', sans-serif", letterSpacing: "2px",
                  cursor: (isUploading || !selectedFile || !encryptionKey) ? "not-allowed" : "pointer",
                  boxShadow: (isUploading || !selectedFile || !encryptionKey) ? "none" : "0 10px 40px rgba(0,255,100,0.3)",
                  transition: "all 0.2s"
                }}
              >
                {isUploading ? "Saving your file..." : "Secure & Upload"}
              </button>
            </div>
          </form>
        </div>

        {/* ── SUCCESS MODAL (Recovery Key) ── */}
        <AnimatePresence>
          {showSuccessModal && (
            <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)" }} />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                style={{
                  position: "relative", width: "100%", maxWidth: "560px", background: "#050f05", 
                  border: "1px solid rgba(0,255,100,0.3)", borderRadius: "28px", padding: "48px",
                  boxShadow: "0 30px 100px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,100,0.1)",
                  textAlign: "center"
                }}
              >
                <div style={{ fontSize: "4rem", marginBottom: "24px" }}>🎉</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "2rem", fontWeight: "800", marginBottom: "12px" }}>File Saved!</h2>
                <p style={{ color: "rgba(150,200,150,0.6)", fontSize: "1rem", marginBottom: "40px" }}>Your file is now locked and stored safely in our vault.</p>

                <div style={{ background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "16px", padding: "24px", marginBottom: "32px", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "1.2rem" }}>🔑</span>
                    <span style={{ color: "#ffaa00", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "1px" }}>Backup Recovery Key</span>
                  </div>
                  <div style={{ background: "#000", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,170,0,0.3)", marginBottom: "16px", wordBreak: "break-all", fontFamily: "'JetBrains Mono', monospace", color: "#ffaa00", fontSize: "0.95rem", lineHeight: 1.5 }}>
                    {generatedRecoveryKey}
                  </div>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button onClick={copyRecoveryKey} style={{ flex: 1, padding: "10px", background: "rgba(255,170,0,0.1)", color: "#ffaa00", border: "1px solid rgba(255,170,0,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}>Copy Key</button>
                    <button onClick={downloadRecoveryKey} style={{ flex: 1, padding: "10px", background: "rgba(255,170,0,0.1)", color: "#ffaa00", border: "1px solid rgba(255,170,0,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "700" }}>Download .txt</button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", textAlign: "left", padding: "0 10px", marginBottom: "32px" }}>
                  <input 
                    type="checkbox" 
                    id="confirm-key" 
                    checked={hasConfirmedKeySave} 
                    onChange={(e) => setHasConfirmedKeySave(e.target.checked)}
                    style={{ marginTop: "4px", width: "18px", height: "18px", accentColor: "#00ff64" }}
                  />
                  <label htmlFor="confirm-key" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", lineHeight: 1.4, cursor: "pointer" }}>
                    I have saved this backup key safely. I know that I need this key or my phrase to get my file back.
                  </label>
                </div>

                <button 
                  disabled={!hasConfirmedKeySave}
                  onClick={() => { setShowSuccessModal(false); navigate("/myfiles"); }}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "12px", border: "none",
                    background: !hasConfirmedKeySave ? "rgba(255,255,255,0.05)" : "#00ff64",
                    color: !hasConfirmedKeySave ? "rgba(255,255,255,0.2)" : "#000",
                    fontSize: "1rem", fontWeight: "800", cursor: !hasConfirmedKeySave ? "not-allowed" : "pointer"
                  }}
                >
                  Return to My Files
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default Upload;