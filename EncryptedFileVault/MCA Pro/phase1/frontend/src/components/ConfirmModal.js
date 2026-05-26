import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", isProcessing = false }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => !isProcessing && onCancel()}
            style={{ position: "absolute", inset: 0, background: "rgba(3,11,3,0.8)", backdropFilter: "blur(6px)" }} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            style={{ position: "relative", width: "100%", maxWidth: "420px", background: "rgba(10, 15, 10, 0.95)", border: "1px solid rgba(255, 50, 50, 0.3)", borderRadius: "20px", padding: "32px", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(255,50,50,0.1)" }}>
            
            <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1.4rem", fontWeight: 800, marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.8rem" }}>⚠️</span> {title || "Are you sure?"}
            </h3>
            
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", marginBottom: "32px", lineHeight: 1.5 }}>
              {message || "Do you really want to delete this? You won't be able to get it back."}
            </p>

            <div style={{ display: "flex", gap: "16px" }}>
              <button 
                onClick={onCancel} 
                disabled={isProcessing}
                style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: "0.95rem", cursor: isProcessing ? "not-allowed" : "pointer", fontWeight: 700, transition: "background 0.2s" }}
                onMouseEnter={(e) => e.target.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.target.style.background = "rgba(255,255,255,0.05)"}
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm} 
                disabled={isProcessing}
                style={{ flex: 1, padding: "14px", background: "rgba(255, 50, 50, 0.15)", color: "#ff4444", border: "1px solid rgba(255, 50, 50, 0.5)", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700, cursor: isProcessing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
                onMouseEnter={(e) => { e.target.style.background = "rgba(255, 50, 50, 0.25)"; e.target.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.target.style.background = "rgba(255, 50, 50, 0.15)"; e.target.style.transform = "scale(1)"; }}
              >
                {isProcessing ? "Deleting..." : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
