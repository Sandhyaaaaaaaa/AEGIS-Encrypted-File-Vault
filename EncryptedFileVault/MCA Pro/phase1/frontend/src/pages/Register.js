import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/authService";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "", vaultPin: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Restrict PIN to digits only and max 6
    if (name === "vaultPin") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
      setFormData({ ...formData, [name]: digitsOnly });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.vaultPin && formData.vaultPin.length !== 6) {
      setError("Vault Recovery PIN must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await register(formData.username, formData.email, formData.password, formData.vaultPin || null);
      navigate("/mfa-setup");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "#e2ffe8",
    fontSize: "0.92rem", fontFamily: "'DM Sans', sans-serif",
    outline: "none", transition: "all 0.2s", boxSizing: "border-box",
  };

  const pinFilled = formData.vaultPin.length === 6;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,100,0.3)} 50%{box-shadow:0 0 0 8px rgba(0,255,100,0)} }
        .reg-input:focus { border-color: rgba(0,255,100,0.5) !important; background: rgba(0,255,100,0.05) !important; box-shadow: 0 0 0 3px rgba(0,255,100,0.08) !important; }
        .pin-input:focus { border-color: rgba(255,170,0,0.5) !important; background: rgba(255,170,0,0.05) !important; box-shadow: 0 0 0 3px rgba(255,170,0,0.08) !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #050f05 inset !important; -webkit-text-fill-color: #e2ffe8 !important; }
      `}</style>

      <div style={{
        minHeight: "100vh", width: "100vw", overflow: "hidden",
        background: "#030b03", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative",
      }}>
        {/* Background grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, opacity: 0.06,
          backgroundImage: "linear-gradient(rgba(0,255,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        {/* Status bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(0,255,100,0.1)", backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(0,255,100,0.6)", letterSpacing: "2px" }}>
            Aegis | Create Account
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["ENCRYPTION: AES-256", "MFA: REQUIRED", "STATUS: SECURE"].map(s => (
              <div key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(0,255,100,0.5)", letterSpacing: "1px" }}>
                <span style={{ color: "#00ff64" }}>●</span> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "min(95vw, 480px)", position: "relative", zIndex: 1,
            borderRadius: "20px", overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,255,100,0.15), 0 40px 80px rgba(0,0,0,0.8)",
            background: "rgba(4,12,4,0.97)", padding: "50px 44px",
          }}
        >
          {/* Corner decorations */}
          <div style={{ position: "absolute", top: 0, right: 0, width: "100px", height: "100px", borderBottom: "1px solid rgba(0,255,100,0.08)", borderLeft: "1px solid rgba(0,255,100,0.08)", borderRadius: "0 0 0 100%" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "70px", height: "70px", borderTop: "1px solid rgba(0,255,100,0.08)", borderRight: "1px solid rgba(0,255,100,0.08)", borderRadius: "0 100% 0 0" }} />

          {/* Header */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", boxShadow: "0 0 16px rgba(0,255,100,0.4)" }}>🛡️</div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: "800", color: "#fff", letterSpacing: "3px" }}>Aegis</span>
            </div>
            <p style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "3px", marginBottom: "6px" }}>Create Account</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.9rem", fontWeight: "800", color: "#fff", letterSpacing: "-0.5px" }}>
              Join <span style={{ color: "#00ff64" }}>Aegis</span>
            </h2>
            <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.83rem", marginTop: "6px" }}>
              MFA setup required after registration
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b6b", fontSize: "0.82rem", marginBottom: "16px" }}>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>Username</label>
              <input className="reg-input" name="username" type="text"
                value={formData.username} onChange={handleChange}
                placeholder="Enter your username" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>Email Address</label>
              <input className="reg-input" name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="Enter your email" required style={inputStyle} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontWeight: "600", letterSpacing: "1px", marginBottom: "7px" }}>Password</label>
              <input className="reg-input" name="password" type="password"
                value={formData.password} onChange={handleChange}
                placeholder="Create a strong password" required style={inputStyle} />
            </div>

            {/* Vault Recovery PIN */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                <span style={{ fontSize: "0.85rem" }}>🔑</span>
                <label style={{ display: "block", color: "#ffaa00", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "1px" }}>Vault Recovery PIN</label>
                {pinFilled && <span style={{ color: "#00ff64", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>✓ Valid</span>}
              </div>
              <input
                className="pin-input"
                name="vaultPin"
                type="text"
                inputMode="numeric"
                value={formData.vaultPin}
                onChange={handleChange}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                style={{
                  ...inputStyle,
                  border: pinFilled ? "1.5px solid rgba(255,170,0,0.4)" : "1.5px solid rgba(255,255,255,0.1)",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "8px",
                  textAlign: "center",
                  fontSize: "1.3rem",
                }}
              />
              <p style={{ color: "rgba(255,170,0,0.5)", fontSize: "0.75rem", marginTop: "8px", lineHeight: "1.5" }}>
                If you forget your passphrase, use this PIN to recover your files. Must be exactly 6 digits.
              </p>
              {/* PIN strength indicator */}
              <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    flex: 1, height: "3px", borderRadius: "2px",
                    background: i < formData.vaultPin.length ? "#ffaa00" : "rgba(255,255,255,0.06)",
                    transition: "background 0.2s"
                  }} />
                ))}
              </div>
            </div>

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{
                width: "100%", padding: "14px",
                background: loading ? "rgba(0,255,100,0.1)" : "linear-gradient(90deg, #00cc44, #00ff64)",
                border: "none", borderRadius: "10px",
                color: loading ? "rgba(0,255,100,0.4)" : "#000",
                fontSize: "0.9rem", fontWeight: "700",
                fontFamily: "'Syne', sans-serif", cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "1.5px",
                boxShadow: loading ? "none" : "0 0 30px rgba(0,255,100,0.3)",
                animation: !loading ? "pulse-green 2s infinite" : "none",
              }}>
              {loading ? "Creating Account..." : "Join Aegis"}
            </motion.button>
          </form>

          {/* ✅ Fixed — normal readable text */}
          <p style={{ marginTop: "24px", color: "rgba(100,150,100,0.5)", fontSize: "0.85rem", textAlign: "center" }}>
            Already have an account?{" "}
            <Link to="/" style={{ color: "#00ff64", textDecoration: "none", fontWeight: "700" }}>Login</Link>
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Register;