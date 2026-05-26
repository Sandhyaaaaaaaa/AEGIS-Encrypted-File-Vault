import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  const inputStyle = { width: "100%", padding: "16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "14px", color: "#fff", fontSize: "0.95rem", outline: "none", transition: "all 0.3s ease" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-obsidian)", padding: "120px 20px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        
        <header style={{ textAlign: "center", marginBottom: "80px" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 style={{ fontSize: "3.5rem", color: "#fff", fontWeight: "800", marginBottom: "16px" }}>Establish <span style={{ color: "var(--emerald-neon)" }}>Contact</span></h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Direct encrypted channel to our support operations.</p>
          </motion.div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "60px", alignItems: "start" }}>
          
          {/* Info Side */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            <div className="glass" style={{ padding: "40px", borderRadius: "32px", borderLeft: "4px solid var(--emerald-neon)" }}>
              <h3 style={{ color: "#fff", fontSize: "1.4rem", marginBottom: "20px" }}>Corporate Intelligence</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {[
                  { label: "SECURE CHANNEL", val: "support@aegis-vault.io", icon: "📧" },
                  { label: "HEADQUARTERS", val: "Silicon Shards, Zurich, CH", icon: "📍" },
                  { label: "ENCRYPTION STATUS", val: "E2EE Operational", icon: "🛡️" }
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "20px" }}>
                    <div style={{ fontSize: "1.5rem" }}>{item.icon}</div>
                    <div>
                      <div className="mono" style={{ fontSize: "0.7rem", color: "var(--emerald-neon)", letterSpacing: "2px", fontWeight: "700" }}>{item.label}</div>
                      <div style={{ color: "#fff", fontSize: "1rem" }}>{item.val}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass" style={{ padding: "40px", borderRadius: "32px" }}>
              <h3 style={{ color: "#fff", fontSize: "1.4rem", marginBottom: "12px" }}>Response Metrics</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>Our security team monitors all channels 24/7. Average decryption and response time: <span style={{ color: "var(--emerald-neon)", fontWeight: "700" }}>&lt; 4 Hours</span>.</p>
            </div>
          </motion.div>

          {/* Form Side */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="glass" style={{ padding: "50px", borderRadius: "32px", position: "relative", overflow: "hidden" }}>
            
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ fontSize: "5rem", marginBottom: "24px" }}>✅</div>
                  <h3 style={{ fontSize: "2rem", color: "#fff", marginBottom: "16px" }}>Signal Transmitted</h3>
                  <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>Your message has been encrypted and sent to our secure terminal. We will respond shortly.</p>
                  <motion.button onClick={() => setSubmitted(false)} whileHover={{ scale: 1.05 }}
                    style={{ padding: "14px 28px", background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)", borderRadius: "14px", color: "#fff", cursor: "pointer", fontWeight: "600" }}>Send another message</motion.button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                    <div>
                      <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>NAME</label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Cyber Sentinel" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>EMAIL</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="sentinel@aegis.io" style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>SUBJECT</label>
                    <input type="text" required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Inquiry regarding zero-knowledge" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: "32px" }}>
                    <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", fontWeight: "700", marginBottom: "8px", letterSpacing: "1px" }}>MESSAGE</label>
                    <textarea required rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Your encrypted message here..." style={{ ...inputStyle, resize: "none" }} />
                  </div>
                  <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02, boxShadow: "0 10px 20px var(--emerald-glow)" }} whileTap={{ scale: 0.98 }}
                    style={{ width: "100%", padding: "20px", background: "var(--emerald-neon)", color: "#000", border: "none", borderRadius: "16px", fontWeight: "800", fontSize: "1.1rem", cursor: "pointer" }}>
                    {loading ? "TRANSMITTING..." : "🔒 SEND ENCRYPTED MESSAGE"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
