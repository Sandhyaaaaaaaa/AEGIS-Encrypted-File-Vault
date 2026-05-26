import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { login, validateMFA, verifyVaultPin } from "../services/authService";

// ─── Matrix Rain Background ────────────────────────────────────────────────────
const MatrixRain = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const cols = Math.floor(canvas.width / 20);
    const drops = Array(cols).fill(1);
    const chars = "AEGIS01アイウエオカキクケコABCDEF0123456789∑∆ΩΠΣΨΞ";
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const opacity = Math.random() * 0.5 + 0.1;
        ctx.fillStyle = `rgba(0,255,100,${opacity})`;
        ctx.font = "14px JetBrains Mono, monospace";
        ctx.fillText(char, i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };
    const id = setInterval(draw, 50);
    return () => { clearInterval(id); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, opacity: 0.18, pointerEvents: "none" }} />;
};

// ─── Sliding Image Panel ───────────────────────────────────────────────────────
const slides = [
  {
    url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    title: "Military-Grade Encryption",
    sub: "AES-256-GCM — the same standard used by governments worldwide",
    tag: "Encryption",
  },
  {
    url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    title: "Zero Knowledge Architecture",
    sub: "Your files are encrypted before they ever leave your device",
    tag: "Privacy",
  },
  {
    url: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80",
    title: "Multi-Factor Authentication",
    sub: "Every login verified with TOTP — no exceptions",
    tag: "Security",
  },
  {
    url: "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?w=800&q=80",
    title: "Integrity Verification",
    sub: "SHA-256 hash ensures your files are never tampered with",
    tag: "Integrity",
  },
];

const ImageSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {slides.map((s, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{ opacity: i === current ? 1 : 0, scale: i === current ? 1 : 1.05 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${s.url})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
      ))}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.6) 100%)" }} />
      <motion.div
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
        style={{ position: "absolute", left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(0,255,100,0.6), transparent)", boxShadow: "0 0 20px rgba(0,255,100,0.4)" }}
      />
      <div style={{ position: "absolute", top: "40px", left: "40px", right: "40px" }}>
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", background: "linear-gradient(135deg, #00ff64, #00cc44)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", boxShadow: "0 0 20px rgba(0,255,100,0.5)" }}>🛡️</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: "800", color: "#fff", letterSpacing: "4px" }}>AEGIS</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6rem", color: "rgba(0,255,100,0.7)", letterSpacing: "3px" }}>Secure File Vault</div>
          </div>
        </motion.div>
      </div>
      <div style={{ position: "absolute", bottom: "50px", left: "40px", right: "40px" }}>
        <AnimatePresence mode="wait">
          <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.6 }}>
            <div style={{ display: "inline-block", padding: "3px 10px", background: "rgba(0,255,100,0.15)", border: "1px solid rgba(0,255,100,0.4)", borderRadius: "4px", color: "#00ff64", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", letterSpacing: "3px", marginBottom: "12px" }}>{slides[current].tag}</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.8rem", fontWeight: "700", color: "#fff", marginBottom: "10px", lineHeight: 1.2 }}>{slides[current].title}</h2>
            <p style={{ color: "rgba(200,220,200,0.7)", fontSize: "0.88rem", lineHeight: 1.6, maxWidth: "340px" }}>{slides[current].sub}</p>
          </motion.div>
        </AnimatePresence>
        <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
          {slides.map((_, i) => (
            <motion.div key={i} onClick={() => setCurrent(i)}
              animate={{ width: i === current ? "28px" : "8px", background: i === current ? "#00ff64" : "rgba(255,255,255,0.3)" }}
              style={{ height: "8px", borderRadius: "4px", cursor: "pointer" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── OTP Input ─────────────────────────────────────────────────────────────────
const OTPInput = ({ value, onChange }) => {
  const inputs = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);
  const handleKey = (e, i) => {
    if (e.key === "Backspace") {
      const newVal = value.slice(0, i) + value.slice(i + 1);
      onChange(newVal);
      if (i > 0) inputs.current[i - 1]?.focus();
    } else if (/^\d$/.test(e.key)) {
      const newVal = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6);
      onChange(newVal);
      if (i < 5) inputs.current[i + 1]?.focus();
    }
  };
  return (
    <div style={{ display: "flex", gap: "8px", justifyContent: "center", margin: "20px 0" }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (inputs.current[i] = el)}
          value={d} onChange={() => {}} onKeyDown={(e) => handleKey(e, i)} maxLength={1}
          style={{
            width: "46px", height: "54px", textAlign: "center",
            fontSize: "1.4rem", fontWeight: "700",
            fontFamily: "'JetBrains Mono', monospace",
            background: d ? "rgba(0,255,100,0.1)" : "rgba(255,255,255,0.04)",
            border: d ? "2px solid rgba(0,255,100,0.6)" : "2px solid rgba(255,255,255,0.1)",
            borderRadius: "10px", color: "#00ff64", outline: "none",
            boxShadow: d ? "0 0 12px rgba(0,255,100,0.2)" : "none", transition: "all 0.2s",
          }}
          onFocus={(e) => e.target.style.border = "2px solid rgba(0,255,100,0.8)"}
          onBlur={(e) => e.target.style.border = d ? "2px solid rgba(0,255,100,0.6)" : "2px solid rgba(255,255,255,0.1)"}
        />
      ))}
    </div>
  );
};

// ─── Typing Effect ─────────────────────────────────────────────────────────────
const TypingText = ({ text }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, [text]);
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "#00ff64", fontSize: "0.78rem" }}>
      {displayed}<span style={{ animation: "blink 1s infinite" }}>_</span>
    </span>
  );
};

// ─── Main Login ────────────────────────────────────────────────────────────────
const Login = () => {
  const [step, setStep] = useState("credentials");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [vaultPin, setVaultPin] = useState("");
  const [userId, setUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCredentials = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await login(formData.email, formData.password);

      if (res.mfaSetupRequired) {
        // ✅ MFA never set up → save temp token and force setup
        sessionStorage.setItem('token', res.token);
        navigate('/mfa-setup');
      } else if (res.mfaRequired) {
        // ✅ MFA enabled → go to OTP step
        setUserId(res.userId);
        setStep("otp");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed.");
    } finally { setLoading(false); }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("Enter complete 6-digit OTP");
    setError(""); setLoading(true);
    try {
      await validateMFA(userId, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally { setLoading(false); }
  };

  const handleRecovery = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(vaultPin)) return setError("PIN must be 4 to 6 digits");
    setError(""); setLoading(true);
    try {
      await verifyVaultPin(formData.email, vaultPin);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid Recovery PIN.");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", padding: "13px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "10px", color: "#e2ffe8",
    fontSize: "0.92rem", fontFamily: "'DM Sans', sans-serif",
    outline: "none", transition: "all 0.2s", boxSizing: "border-box",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,100,0.3)} 50%{box-shadow:0 0 0 8px rgba(0,255,100,0)} }
        .field-input:focus { border-color: rgba(0,255,100,0.5) !important; background: rgba(0,255,100,0.05) !important; box-shadow: 0 0 0 3px rgba(0,255,100,0.08) !important; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #050f05 inset !important; -webkit-text-fill-color: #e2ffe8 !important; }
      `}</style>

      <div style={{
        minHeight: "100vh", width: "100vw", overflow: "hidden",
        background: "#030b03", display: "flex", alignItems: "center",
        justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative",
      }}>
        <MatrixRain />

        {/* Status bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,0,0,0.6)", borderBottom: "1px solid rgba(0,255,100,0.1)", backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(0,255,100,0.6)", letterSpacing: "2px" }}>
            Aegis | Secure Vault v2.0
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["ENCRYPTION: AES-256", "STATUS: SECURE", "TLS: ACTIVE"].map(s => (
              <div key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(0,255,100,0.5)", letterSpacing: "1px" }}>
                <span style={{ color: "#00ff64" }}>●</span> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex", width: "min(95vw, 1050px)", height: "min(90vh, 640px)",
            borderRadius: "20px", overflow: "hidden", position: "relative", zIndex: 1,
            boxShadow: "0 0 0 1px rgba(0,255,100,0.15), 0 40px 80px rgba(0,0,0,0.8), 0 0 60px rgba(0,255,100,0.05)",
          }}
        >
          <div style={{ flex: "1.2", position: "relative" }}>
            <ImageSlider />
          </div>

          <div style={{
            flex: 1, padding: "50px 44px",
            background: "rgba(4,12,4,0.97)",
            borderLeft: "1px solid rgba(0,255,100,0.1)",
            display: "flex", flexDirection: "column", justifyContent: "center",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", borderBottom: "1px solid rgba(0,255,100,0.08)", borderLeft: "1px solid rgba(0,255,100,0.08)", borderRadius: "0 0 0 100%" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: "80px", height: "80px", borderTop: "1px solid rgba(0,255,100,0.08)", borderRight: "1px solid rgba(0,255,100,0.08)", borderRadius: "0 100% 0 0" }} />

            <AnimatePresence mode="wait">
              {step === "credentials" && (
                <motion.div key="creds"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                  <div style={{ marginBottom: "28px" }}>
                    <TypingText text="Initiating secure login..." />
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "2rem", fontWeight: "800", color: "#fff", marginTop: "10px", letterSpacing: "-0.5px" }}>
                      Access <span style={{ color: "#00ff64" }}>Aegis</span>
                    </h2>
                    <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.83rem", marginTop: "6px", fontFamily: "'JetBrains Mono', monospace" }}>
                      Authorized personnel only
                    </p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b6b", fontSize: "0.82rem", marginBottom: "16px", fontFamily: "'JetBrains Mono', monospace" }}>
                      ✗ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleCredentials}>
                    <div style={{ marginBottom: "14px" }}>
                      <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", marginBottom: "7px" }}>Email Address</label>
                      <input className="field-input" name="email" type="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="user@aegis.secure" required style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: "10px" }}>
                      <label style={{ display: "block", color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", marginBottom: "7px" }}>Password</label>
                      <div style={{ position: "relative" }}>
                        <input className="field-input" name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password} onChange={handleChange}
                          placeholder="••••••••••••" required
                          style={{ ...inputStyle, paddingRight: "46px" }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position: "absolute", right: "13px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(0,255,100,0.4)", fontSize: "0.9rem" }}>
                          {showPassword ? "🙈" : "👁"}
                        </button>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", marginBottom: "22px" }}>
                      <span onClick={() => navigate("/forgot-password")}
                        style={{ color: "rgba(0,255,100,0.6)", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>
                        Forgot Password?
                      </span>
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
                      {loading ? "Authenticating..." : "Login"}
                    </motion.button>
                  </form>

                  <p style={{ marginTop: "24px", color: "rgba(100,150,100,0.5)", fontSize: "0.82rem", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                    Don't have an account?{" "}
                    <Link to="/register" style={{ color: "#00ff64", textDecoration: "none", fontWeight: "700" }}>Register</Link>
                  </p>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div key="otp"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                  <div style={{ marginBottom: "20px" }}>
                    <TypingText text="MFA verification required..." />
                      <span style={{ color: "#00ff64" }}>Two-Factor</span> Verification
                    <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.82rem", marginTop: "6px", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                      Open Google Authenticator → enter 6-digit code for AEGIS
                    </p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b6b", fontSize: "0.82rem", marginBottom: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                      ✗ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleOTP}>
                    <OTPInput value={otp} onChange={setOtp} />
                    <div style={{ height: "2px", background: "rgba(0,255,100,0.1)", borderRadius: "2px", marginBottom: "20px", overflow: "hidden" }}>
                      <motion.div
                        animate={{ width: ["100%", "0%"] }}
                        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
                        style={{ height: "100%", background: "linear-gradient(90deg, #00ff64, #00cc44)", borderRadius: "2px" }}
                      />
                    </div>

                    <motion.button type="submit"
                      disabled={loading || otp.length !== 6}
                      whileHover={{ scale: otp.length === 6 ? 1.02 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: "100%", padding: "14px",
                        background: otp.length === 6 ? "linear-gradient(90deg, #00cc44, #00ff64)" : "rgba(255,255,255,0.04)",
                        border: otp.length === 6 ? "none" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        color: otp.length === 6 ? "#000" : "rgba(255,255,255,0.2)",
                        fontSize: "0.9rem", fontWeight: "700",
                        fontFamily: "'Syne', sans-serif",
                        cursor: otp.length === 6 ? "pointer" : "not-allowed",
                        letterSpacing: "1.5px",
                        boxShadow: otp.length === 6 ? "0 0 30px rgba(0,255,100,0.3)" : "none",
                        transition: "all 0.3s",
                      }}>
                      {loading ? "Verifying..." : "Verify & Enter"}
                    </motion.button>
                  </form>

                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "18px" }}>
                    <button onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
                      style={{ background: "none", border: "none", color: "rgba(0,255,100,0.4)", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'JetBrains Mono', monospace" }}>
                      ← Back to Login
                    </button>
                    <button onClick={() => { setStep("recovery"); setOtp(""); setError(""); }}
                      style={{ background: "none", border: "none", color: "rgba(0,170,255,0.6)", cursor: "pointer", fontSize: "0.78rem", fontFamily: "'JetBrains Mono', monospace" }}>
                      Lost MFA Device?
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "recovery" && (
                <motion.div key="recovery"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                  <div style={{ marginBottom: "20px" }}>
                    <TypingText text="Executing vault pin recovery..." />
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.9rem", fontWeight: "800", color: "#fff", marginTop: "10px" }}>
                      Vault <span style={{ color: "#00aaff" }}>Recovery</span>
                    </h2>
                    <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.82rem", marginTop: "6px", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}>
                      Enter your 4-6 digit Vault PIN to bypass MFA and access your account
                    </p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b6b", fontSize: "0.82rem", marginBottom: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
                      ✗ {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleRecovery}>
                    <div style={{ marginBottom: "20px" }}>
                      <input className="field-input" type="password"
                        value={vaultPin} onChange={(e) => setVaultPin(e.target.value)}
                        placeholder="Enter Vault PIN" required
                        style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "1.2rem", fontWeight: "bold" }} />
                    </div>

                    <motion.button type="submit"
                      disabled={loading || vaultPin.length < 4}
                      whileHover={{ scale: vaultPin.length >= 4 ? 1.02 : 1 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        width: "100%", padding: "14px",
                        background: vaultPin.length >= 4 ? "linear-gradient(90deg, #0088cc, #00aaff)" : "rgba(255,255,255,0.04)",
                        border: vaultPin.length >= 4 ? "none" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "10px",
                        color: vaultPin.length >= 4 ? "#fff" : "rgba(255,255,255,0.2)",
                        fontSize: "0.9rem", fontWeight: "700",
                        fontFamily: "'Syne', sans-serif",
                        cursor: vaultPin.length >= 4 ? "pointer" : "not-allowed",
                        letterSpacing: "1.5px",
                        boxShadow: vaultPin.length >= 4 ? "0 0 30px rgba(0,170,255,0.3)" : "none",
                        transition: "all 0.3s",
                      }}>
                      {loading ? "Recovering..." : "Recover Account"}
                    </motion.button>
                  </form>

                  <button onClick={() => { setStep("otp"); setVaultPin(""); setError(""); }}
                    style={{ marginTop: "18px", background: "none", border: "none", color: "rgba(0,255,100,0.4)", cursor: "pointer", fontSize: "0.78rem", width: "100%", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                    ← Back to OTP
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;