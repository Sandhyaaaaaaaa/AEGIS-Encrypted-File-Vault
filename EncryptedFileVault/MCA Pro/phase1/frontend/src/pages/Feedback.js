import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../config/api";

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      await api.post("/feedback", formData);
      setStatus({ type: "success", msg: "Feedback received. Thank you for your feedback!" });
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus({ type: "error", msg: err.response?.data?.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030b03", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono&display=swap');
        .glass-input:focus { border-color: #00ff64 !important; background: rgba(0,255,100,0.05) !important; }
      `}</style>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ width: "100%", maxWidth: "600px", background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "32px", padding: "50px", backdropFilter: "blur(20px)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}>
        
        <header style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💬</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", color: "#fff", fontWeight: 800, marginBottom: "8px" }}>Vault Feedback</h1>
          <p style={{ color: "rgba(150,220,150,0.4)", fontSize: "0.95rem" }}>Your insights help us improve Aegis Vault.</p>
        </header>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", paddingLeft: "10px" }}>NAME</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. John Doe"
                className="glass-input" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,100,0.15)", borderRadius: "14px", padding: "14px 20px", color: "#fff", outline: "none", transition: "all 0.3s" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", paddingLeft: "10px" }}>EMAIL ADDRESS</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="e.g. agent@aegis.com"
                className="glass-input" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,100,0.15)", borderRadius: "14px", padding: "14px 20px", color: "#fff", outline: "none", transition: "all 0.3s" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", paddingLeft: "10px" }}>MESSAGE</label>
            <textarea name="message" value={formData.message} onChange={handleChange} required placeholder="Your message..."
              className="glass-input" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,255,100,0.15)", borderRadius: "14px", padding: "14px 20px", color: "#fff", outline: "none", transition: "all 0.3s", minHeight: "150px", resize: "none" }} />
          </div>

          <AnimatePresence>
            {status.msg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ padding: "12px", borderRadius: "12px", background: status.type === "success" ? "rgba(0,255,100,0.1)" : "rgba(255,68,68,0.1)", border: `1px solid ${status.type === "success" ? "#00ff64" : "#ff4444"}40`, color: status.type === "success" ? "#00ff64" : "#ff4444", fontSize: "0.85rem", textAlign: "center" }}>
                {status.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
            style={{ marginTop: "10px", padding: "16px", background: "#00ff64", color: "#000", border: "none", borderRadius: "16px", fontSize: "1rem", fontWeight: 800, fontFamily: "'Syne', sans-serif", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,255,100,0.2)" }}>
            {loading ? "SENDING..." : "SUBMIT FEEDBACK"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Feedback;
