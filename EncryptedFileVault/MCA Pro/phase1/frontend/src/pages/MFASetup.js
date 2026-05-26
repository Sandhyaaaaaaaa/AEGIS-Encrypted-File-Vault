import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { setupMFA, verifyMFA } from "../services/authService";

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
            width: "48px", height: "56px", textAlign: "center",
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

// ─── Main MFASetup ─────────────────────────────────────────────────────────────
const MFASetup = () => {
  const [step, setStep] = useState("qr");
  const [qrCode, setQrCode] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingQR, setFetchingQR] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await setupMFA();
        setQrCode(res.qrCode);
      } catch (err) {
        setError("Failed to generate QR code. Please try again.");
      } finally {
        setFetchingQR(false);
      }
    };
    fetchQR();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("Please enter the complete 6-digit OTP");
    setError(""); setLoading(true);
    try {
      await verifyMFA(otp);
      setStep("success");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(0,255,100,0.3)} 50%{box-shadow:0 0 0 8px rgba(0,255,100,0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{
        minHeight: "100vh", width: "100vw",
        background: "#030b03",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden",
      }}>
        {/* Background grid */}
        <div style={{
          position: "fixed", inset: 0, zIndex: 0, opacity: 0.06,
          backgroundImage: "linear-gradient(rgba(0,255,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,100,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,255,100,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        {/* Status bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
          padding: "10px 30px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,255,100,0.1)", backdropFilter: "blur(10px)",
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(0,255,100,0.6)", letterSpacing: "2px" }}>
            Aegis | Security Setup
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            {["Verification: Active", "Authenticator: Required", "Status: Pending"].map(s => (
              <div key={s} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.65rem", color: "rgba(0,255,100,0.5)", letterSpacing: "1px" }}>
                <span style={{ color: "#00ff64" }}>●</span> {s}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: "min(95vw, 880px)", position: "relative", zIndex: 1,
            borderRadius: "20px", overflow: "hidden",
            boxShadow: "0 0 0 1px rgba(0,255,100,0.15), 0 40px 80px rgba(0,0,0,0.8)",
            display: "flex",
          }}
        >
          {/* LEFT — Info Panel */}
          <div style={{
            flex: "0.8", padding: "60px 44px",
            background: "rgba(4,12,4,0.98)",
            borderRight: "1px solid rgba(0,255,100,0.1)",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ marginBottom: "28px" }}
            >
              <div style={{
                width: "70px", height: "70px", borderRadius: "18px",
                background: "linear-gradient(135deg, rgba(0,255,100,0.2), rgba(0,200,80,0.1))",
                border: "1px solid rgba(0,255,100,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2rem", boxShadow: "0 0 30px rgba(0,255,100,0.15)",
              }}>🛡️</div>
            </motion.div>

            <p style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "3px", marginBottom: "8px" }}>SECURITY SETUP</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.9rem", fontWeight: "800", color: "#fff", marginBottom: "16px", lineHeight: 1.2 }}>
              Activate <span style={{ color: "#00ff64" }}>Two-Factor</span> Authentication
            </h2>
            <p style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.88rem", lineHeight: 1.7, marginBottom: "32px" }}>
              Aegis requires Two-Factor Authentication for all accounts. This adds a critical layer of security — even if your password is compromised, your vault stays protected.
            </p>

            {[
              { n: "01", t: "Install App", d: "Download Google Authenticator on your phone" },
              { n: "02", t: "Scan QR Code", d: "Open the app and scan the QR code on the right" },
              { n: "03", t: "Enter OTP", d: "Type the 6-digit code shown in the app" },
            ].map((s, i) => (
              <motion.div key={s.n}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                style={{ display: "flex", gap: "14px", marginBottom: "18px", alignItems: "flex-start" }}
              >
                <div style={{
                  minWidth: "32px", height: "32px", borderRadius: "8px",
                  background: "rgba(0,255,100,0.1)", border: "1px solid rgba(0,255,100,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "#00ff64",
                }}>{s.n}</div>
                <div>
                  <div style={{ color: "#fff", fontSize: "0.88rem", fontWeight: "600", marginBottom: "2px" }}>{s.t}</div>
                  <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.78rem", lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT — QR + OTP Panel */}
          <div style={{
            flex: 1, padding: "60px 44px",
            background: "rgba(6,16,6,0.98)",
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <AnimatePresence mode="wait">

              {/* QR Step */}
              {step === "qr" && (
                <motion.div key="qr"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                  <TypingText text="Preparing your unique QR code..." />
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: "700", color: "#fff", margin: "10px 0 8px" }}>
                    Scan with <span style={{ color: "#00ff64" }}>Google Authenticator</span>
                  </h3>
                  <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.83rem", marginBottom: "20px" }}>
                    Open Google Authenticator on your phone and scan the QR code below.
                  </p>

                  {/* QR Code */}
                  <div style={{
                    width: "200px", height: "200px", margin: "0 auto 28px",
                    borderRadius: "16px", overflow: "hidden",
                    border: "2px solid rgba(0,255,100,0.3)",
                    boxShadow: "0 0 30px rgba(0,255,100,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#fff",
                  }}>
                    {fetchingQR ? (
                      <div style={{ width: "36px", height: "36px", border: "3px solid rgba(0,255,100,0.2)", borderTop: "3px solid #00ff64", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    ) : (
                      <img src={qrCode} alt="MFA QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    )}
                  </div>

                  <motion.button
                    onClick={() => setStep("verify")}
                    disabled={fetchingQR}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    style={{
                      width: "100%", padding: "14px",
                      background: fetchingQR ? "rgba(0,255,100,0.1)" : "linear-gradient(90deg, #00cc44, #00ff64)",
                      border: "none", borderRadius: "10px",
                      color: fetchingQR ? "rgba(0,255,100,0.3)" : "#000",
                      fontSize: "0.9rem", fontWeight: "700",
                      fontFamily: "'Syne', sans-serif",
                      cursor: fetchingQR ? "not-allowed" : "pointer",
                      letterSpacing: "1.5px",
                      boxShadow: fetchingQR ? "none" : "0 0 30px rgba(0,255,100,0.3)",
                      animation: !fetchingQR ? "pulse-green 2s infinite" : "none",
                    }}>
                    {fetchingQR ? "Generating..." : "I Scanned It →"}
                  </motion.button>
                </motion.div>
              )}

              {/* Verify Step */}
              {step === "verify" && (
                <motion.div key="verify"
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
                  <TypingText text="> enter otp to confirm setup..." />
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.4rem", fontWeight: "700", color: "#fff", margin: "10px 0 8px" }}>
                    Confirm <span style={{ color: "#00ff64" }}>OTP</span>
                  </h3>
                  <p style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.83rem", marginBottom: "8px", lineHeight: 1.6 }}>
                    Enter the 6-digit code shown in Google Authenticator to activate MFA.
                  </p>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b6b", fontSize: "0.82rem", marginBottom: "12px" }}>
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleVerify}>
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
                      {loading ? "Verifying..." : "Activate Protection"}
                    </motion.button>
                  </form>

                  {/* ✅ Fixed — normal readable text */}
                  <button onClick={() => { setStep("qr"); setOtp(""); setError(""); }}
                    style={{ marginTop: "16px", background: "none", border: "none", color: "rgba(0,255,100,0.4)", cursor: "pointer", fontSize: "0.82rem", width: "100%", textAlign: "center" }}>
                    ← Back to QR Code
                  </button>
                </motion.div>
              )}

              {/* Success Step */}
              {step === "success" && (
                <motion.div key="success"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{ textAlign: "center" }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6 }}
                    style={{ fontSize: "4rem", marginBottom: "20px" }}>
                    ✅
                  </motion.div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.6rem", fontWeight: "800", color: "#fff", marginBottom: "12px" }}>
                    MFA <span style={{ color: "#00ff64" }}>Activated!</span>
                  </h3>
                  <p style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.88rem", lineHeight: 1.6 }}>
                    Your vault is now protected with 2-factor authentication.<br />
                    Redirecting to dashboard...
                  </p>
                  <motion.div
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 2, ease: "linear" }}
                    style={{ height: "2px", background: "#00ff64", borderRadius: "2px", marginTop: "24px" }}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default MFASetup;