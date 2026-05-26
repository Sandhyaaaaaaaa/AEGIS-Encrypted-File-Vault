import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PassphraseModal = ({ isOpen, onClose, onConfirm, filename, action = "DECRYPT" }) => {
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!passphrase) {
      setError("Passphrase is required.");
      return;
    }
    onConfirm(passphrase);
    setPassphrase("");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 
      }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ 
            width: "90%", maxWidth: "400px", background: "#030b03", 
            border: "1px solid var(--emerald-neon)", padding: "30px", 
            boxShadow: "0 0 50px rgba(0,255,102,0.15)" 
          }}
        >
          <h3 className="mono" style={{ color: "var(--emerald-neon)", marginBottom: "20px" }}>
            Unlock File
          </h3>
          <p className="mono" style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            File: {filename}<br/>
            Action: {action}
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label className="mono" style={{ display: "block", color: "var(--emerald-neon)", fontSize: "0.7rem", marginBottom: "8px" }}>
                Enter your secret phrase:
              </label>
              <input 
                autoFocus
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="••••••••••••"
                style={{ 
                  width: "100%", background: "#000", border: "1px solid var(--emerald-border)", 
                  padding: "12px", color: "var(--emerald-neon)", fontSize: "1rem", outline: "none"
                }}
              />
              {error && <div style={{ color: "var(--error-red)", fontSize: "0.7rem", marginTop: "5px" }}>{error}</div>}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                type="button"
                onClick={onClose}
                style={{ 
                  flex: 1, padding: "12px", background: "transparent", 
                  color: "var(--text-secondary)", border: "1px solid var(--emerald-border)", 
                  cursor: "pointer" 
                }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ 
                  flex: 2, padding: "12px", background: "var(--emerald-neon)", 
                  color: "#000", border: "none", fontWeight: "bold", cursor: "pointer" 
                }}
              >
                Unlock Now
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PassphraseModal;
