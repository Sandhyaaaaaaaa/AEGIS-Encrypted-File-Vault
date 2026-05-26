import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ShareModal = ({ isOpen, onClose, onShare, filename }) => {
  const [email, setEmail] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !passphrase) return setError("Please enter both email and secret phrase.");
    
    setLoading(true);
    setError("");
    try {
      await onShare(email, passphrase);
      onClose();
      setEmail("");
      setPassphrase("");
    } catch (err) {
      setError(err.message || "Failed to share file.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel"
          style={{ width: "100%", maxWidth: "450px", padding: "40px", borderRadius: "8px" }}
        >
          <h3 className="mono" style={{ color: "var(--emerald-neon)", marginBottom: "25px" }}>
            Share File
          </h3>
          <p className="mono" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "25px" }}>
            File: {filename}
          </p>

          {error && <div className="mono pill pill-error" style={{ marginBottom: "20px", display: "block", textAlign: "center" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label className="mono" style={{ display: "block", color: "var(--emerald-neon)", fontSize: "0.7rem", marginBottom: "8px" }}>Friend's Email:</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@aegis.vault"
                style={{ width: "100%", background: "#000", border: "1px solid var(--emerald-border)", padding: "12px", color: "var(--emerald-neon)", outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: "30px" }}>
              <label className="mono" style={{ display: "block", color: "var(--emerald-neon)", fontSize: "0.7rem", marginBottom: "8px" }}>File's Secret Phrase:</label>
              <input 
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••"
                style={{ width: "100%", background: "#000", border: "1px solid var(--emerald-border)", padding: "12px", color: "var(--emerald-neon)", outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={onClose} className="mono" style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--glass-border)", color: "var(--text-secondary)", cursor: "pointer" }}>ABORT</button>
              <button 
                type="submit" 
                disabled={loading}
                className="mono" 
                style={{ flex: 2, padding: "12px", background: "var(--emerald-neon)", color: "#000", border: "none", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Sharing..." : "Share Now"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
