import React from "react";
import { motion } from "framer-motion";

const AIAdvisor = () => {
  const securityTopics = [
    { title: "Encryption Standard", detail: "AES-256-GCM", desc: "Military-grade symmetric encryption for data at rest." },
    { title: "Identity Protection", detail: "TOTP MFA", desc: "Two-factor authentication using time-based one-time passwords." },
    { title: "Zero Knowledge", detail: "Client-Side Only", desc: "We never see your keys. Your data sovereignty is absolute." },
    { title: "Data Integrity", detail: "SHA-256", desc: "Cryptographic hashing to ensure files haven't been tampered with." }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#030b03", color: "#fff", padding: "100px 20px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=DM+Sans:wght@400;700&family=JetBrains+Mono&display=swap');
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "80px" }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "3.5rem", fontWeight: 800, marginBottom: "20px", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Aegis Intelligence Hub
          </h1>
          <p style={{ color: "rgba(150,220,150,0.5)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            Your centralized portal for security consultation and cryptographic oversight.
          </p>
        </motion.div>

        {/* Advisor Content */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>
          
          {/* Left: Info Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", color: "#fff", marginBottom: "20px" }}>System Protocols</h2>
            {securityTopics.map((topic, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "20px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ color: "#3b82f6", fontSize: "1.1rem", margin: 0 }}>{topic.title}</h3>
                  <span style={{ fontSize: "0.75rem", fontFamily: "JetBrains Mono", color: "rgba(59, 130, 246, 0.8)", background: "rgba(59, 130, 246, 0.1)", padding: "4px 10px", borderRadius: "8px" }}>{topic.detail}</span>
                </div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>{topic.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Right: Interaction CTA */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "32px", padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: "5rem", marginBottom: "30px" }}>🤖</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", marginBottom: "20px" }}>Need Assistance?</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "40px", lineHeight: 1.6 }}>
              Our AI Security Agent is available 24/7 to help you manage your files, explain encryption, or troubleshoot access issues.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ padding: "12px", background: "rgba(0,255,100,0.05)", border: "1px solid #00ff64", borderRadius: "12px", color: "#00ff64", fontSize: "0.85rem", fontWeight: 700 }}>
                ✓ Real-time Intent Detection
              </div>
              <div style={{ padding: "12px", background: "rgba(0,170,255,0.05)", border: "1px solid #00aaff", borderRadius: "12px", color: "#00aaff", fontSize: "0.85rem", fontWeight: 700 }}>
                ✓ Cryptographic Guidance
              </div>
            </div>
            <p style={{ marginTop: "40px", fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
              Click the brain icon in the bottom corner to start a consultation.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AIAdvisor;
