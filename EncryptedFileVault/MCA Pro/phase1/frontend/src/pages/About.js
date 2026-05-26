import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Full Protection",
      desc: "We make sure your files are locked securely before they even leave your computer.",
      icon: "🔐",
      color: "#00ff64",
    },
    {
      title: "Easy Sharing",
      desc: "Share your locked files with friends safely using our secure sharing system.",
      icon: "📤",
      color: "#00aaff",
    },
    {
      title: "Double Security",
      desc: "Add an extra layer of safety to your account with our mobile security code feature.",
      icon: "🔐",
      color: "#aa88ff",
    },
    {
      title: "Smart Assistant",
      desc: "A helpful assistant to guide you through the app and help you manage your files.",
      icon: "🤖",
      color: "#ffaa00",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#030b03", color: "#fff", padding: "120px 20px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono&display=swap');
      `}</style>

      {/* ── HERO SECTION ── */}
      <section style={{ maxWidth: "1000px", margin: "0 auto 100px", textAlign: "center" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "4rem", fontWeight: 800, marginBottom: "20px", background: "linear-gradient(to bottom, #fff, #00ff64)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            About Aegis Vault
          </h1>
          <p style={{ fontSize: "1.4rem", color: "rgba(150,220,150,0.6)", maxWidth: "700px", margin: "0 auto" }}>
            Keeping your files safe with easy-to-use security and smart storage.
          </p>
        </motion.div>
      </section>

      {/* ── MISSION SECTION ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto 120px" }}>
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "32px", padding: "60px", display: "flex", alignItems: "center", gap: "60px" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", color: "#00ff64", marginBottom: "30px" }}>Our Mission</h2>
            <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.7)" }}>
              At Aegis Vault, we think your privacy is very important. We built this app 
              to give you a safe place for your files. Our platform uses strong security 
              and an easy design so only you can see your data. We don't store 
              your passwords or keys, so your data stays only with you.
            </p>
          </div>
          <div style={{ width: "300px", height: "300px", background: "radial-gradient(circle, rgba(0,255,100,0.1) 0%, transparent 70%)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8rem" }}>
            🛡️
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{ maxWidth: "1200px", margin: "0 auto 120px" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", textAlign: "center", marginBottom: "60px" }}>Key Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, background: "rgba(255,255,255,0.04)" }}
              style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${f.color}20`, borderRadius: "24px", padding: "40px", transition: "all 0.3s" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "20px" }}>{f.icon}</div>
              <h3 style={{ color: f.color, fontSize: "1.2rem", fontWeight: 700, marginBottom: "16px" }}>{f.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.92rem", lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TEAM SECTION ── */}
      <section style={{ maxWidth: "1000px", margin: "0 auto 120px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2.2rem", marginBottom: "60px" }}>About the Developer</h2>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}
          style={{ background: "rgba(255,170,0,0.03)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "32px", padding: "50px", maxWidth: "500px", margin: "0 auto" }}>
          <div style={{ width: "100px", height: "100px", background: "linear-gradient(135deg, #ffaa00, #ffcc00)", borderRadius: "50%", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", boxShadow: "0 0 30px rgba(255,170,0,0.3)" }}>
            👨‍💻
          </div>
          <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Sandhya Nayak</h3>
          <p style={{ color: "#ffaa00", fontSize: "0.9rem", letterSpacing: "2px", fontWeight: 600, textTransform: "uppercase", marginBottom: "20px" }}>Lead Architect & Developer</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.6 }}>
            MCA Student at NMAMIT, focused on building secure and simple web applications.
          </p>
        </motion.div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ textAlign: "center" }}>
        <motion.button 
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/feedback")}
          style={{ padding: "18px 48px", background: "#00ff64", color: "#000", border: "none", borderRadius: "16px", fontSize: "1.1rem", fontWeight: 800, fontFamily: "'Syne', sans-serif", cursor: "pointer", boxShadow: "0 10px 30px rgba(0,255,100,0.3)" }}>
          Contact Us / Send Feedback
        </motion.button>
      </section>
    </div>
  );
};

export default About;