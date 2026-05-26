import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sendRecoveryOTP, verifyRecoveryOTP, finalizeRecovery } from "../services/authService";

// ─── Step Indicator Component ──────────────────────────────────────────────────
const StepIndicator = ({ currentStep }) => {
  const steps = [1, 2, 3, 4];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "40px" }}>
      {steps.map((s) => (
        <React.Fragment key={s}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: s <= currentStep ? "linear-gradient(135deg, #00ff64, #00cc44)" : "rgba(255,255,255,0.05)",
            border: s <= currentStep ? "none" : "1.5px solid rgba(255,255,255,0.1)",
            color: s <= currentStep ? "#000" : "rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.85rem", fontWeight: "700", fontFamily: "'Syne', sans-serif",
            transition: "all 0.4s ease", boxShadow: s <= currentStep ? "0 0 15px rgba(0,255,100,0.3)" : "none"
          }}>
            {s < currentStep ? "✓" : s}
          </div>
          {s < 4 && (
            <div style={{ width: "30px", height: "2px", background: s < currentStep ? "#00ff64" : "rgba(255,255,255,0.1)", transition: "all 0.4s ease" }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── OTP Input Component ───────────────────────────────────────────────────────
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
    <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "25px 0" }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (inputs.current[i] = el)}
          value={d} onChange={() => {}} onKeyDown={(e) => handleKey(e, i)} maxLength={1}
          style={{
            width: "48px", height: "58px", textAlign: "center", fontSize: "1.5rem", fontWeight: "700",
            fontFamily: "'JetBrains Mono', monospace", background: d ? "rgba(0,255,100,0.08)" : "rgba(255,255,255,0.03)",
            border: d ? "2px solid #00ff64" : "2px solid rgba(255,255,255,0.1)", borderRadius: "12px",
            color: "#00ff64", outline: "none", transition: "all 0.2s"
          }}
        />
      ))}
    </div>
  );
};

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [recoveryType, setRecoveryType] = useState("PIN"); // PIN or PHRASE
  const [recoveryValue, setRecoveryValue] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleStartRecovery = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await sendRecoveryOTP(email);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to initiate recovery");
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("Please enter 6-digit code");
    setLoading(true); setError("");
    try {
      await verifyRecoveryOTP(email, otp);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP code");
    } finally { setLoading(false); }
  };

  // Step 3: Finalize
  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!recoveryValue) return setError(`Please enter your ${recoveryType}`);
    if (newPassword.length < 6) return setError("New password must be at least 6 characters");
    setLoading(true); setError("");
    try {
      await finalizeRecovery({ email, recoveryType, recoveryValue, newPassword });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Recovery validation failed");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", padding: "14px 18px", background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: "12px",
    color: "#fff", fontSize: "0.95rem", outline: "none", transition: "all 0.3s",
    boxSizing: "border-box", marginBottom: "20px"
  };

  const buttonStyle = {
    width: "100%", padding: "14px", borderRadius: "12px", border: "none",
    background: "linear-gradient(90deg, #00cc44, #00ff64)", color: "#000",
    fontSize: "0.95rem", fontWeight: "700", cursor: "pointer",
    fontFamily: "'Syne', sans-serif", boxShadow: "0 10px 25px rgba(0,255,100,0.2)"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#030b03", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&family=JetBrains+Mono&display=swap');
        .recovery-card { background: rgba(10,20,10,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(0,255,100,0.1); border-radius: 32px; padding: 50px; width: 100%; maxWidth: 480px; boxShadow: 0 40px 100px rgba(0,0,0,0.6); }
        input:focus { border-color: #00ff64 !important; background: rgba(0,255,100,0.05) !important; }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="recovery-card">
        
        <StepIndicator currentStep={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontFamily: "Syne", fontSize: "1.8rem", marginBottom: "12px" }}>Recover <span style={{ color: "#00ff64" }}>Account</span></h2>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "30px", fontSize: "0.9rem" }}>Enter your registered email address to receive a security code.</p>
              
              {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid #ff4444", color: "#ff4444", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.85rem" }}>{error}</div>}

              <form onSubmit={handleStartRecovery}>
                <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: "2px", color: "#00ff64", marginBottom: "8px", fontWeight: "bold" }}>EMAIL ADDRESS</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required style={inputStyle} />
                <button type="submit" disabled={loading} style={buttonStyle}>{loading ? "Initializing..." : "Start Recovery"}</button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontFamily: "Syne", fontSize: "1.8rem", marginBottom: "12px" }}>Verify <span style={{ color: "#00ff64" }}>Identity</span></h2>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "10px", fontSize: "0.9rem" }}>We've sent a 6-digit code to <strong>{email}</strong>.</p>
              
              {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid #ff4444", color: "#ff4444", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.85rem" }}>{error}</div>}

              <form onSubmit={handleVerifyOTP}>
                <OTPInput value={otp} onChange={setOtp} />
                <button type="submit" disabled={loading || otp.length !== 6} style={buttonStyle}>{loading ? "Verifying..." : "Verify OTP"}</button>
                <button type="button" onClick={() => setStep(1)} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.4)", marginTop: "20px", cursor: "pointer", fontSize: "0.85rem" }}>Change Email</button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 style={{ fontFamily: "Syne", fontSize: "1.8rem", marginBottom: "12px" }}>Secure <span style={{ color: "#00ff64" }}>Reset</span></h2>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "25px", fontSize: "0.9rem" }}>Complete the final verification to reset your access.</p>
              
              {error && <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid #ff4444", color: "#ff4444", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.85rem" }}>{error}</div>}

              <form onSubmit={handleFinalize}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  <button type="button" onClick={() => setRecoveryType("PIN")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: recoveryType === "PIN" ? "1.5px solid #00ff64" : "1.5px solid rgba(255,255,255,0.1)", background: recoveryType === "PIN" ? "rgba(0,255,100,0.05)" : "transparent", color: recoveryType === "PIN" ? "#00ff64" : "rgba(255,255,255,0.4)", fontSize: "0.8rem", cursor: "pointer" }}>Vault PIN</button>
                  <button type="button" onClick={() => setRecoveryType("PHRASE")} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: recoveryType === "PHRASE" ? "1.5px solid #00ff64" : "1.5px solid rgba(255,255,255,0.1)", background: recoveryType === "PHRASE" ? "rgba(0,255,100,0.05)" : "transparent", color: recoveryType === "PHRASE" ? "#00ff64" : "rgba(255,255,255,0.4)", fontSize: "0.8rem", cursor: "pointer" }}>Secret Phrase</button>
                </div>

                <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: "2px", color: "#00ff64", marginBottom: "8px", fontWeight: "bold" }}>ENTER {recoveryType === 'PIN' ? 'VAULT PIN' : 'SECRET PHRASE'}</label>
                <input type={recoveryType === 'PIN' ? 'password' : 'text'} value={recoveryValue} onChange={(e) => setRecoveryValue(e.target.value)} placeholder={recoveryType === 'PIN' ? "••••••" : "Your secret phrase"} required style={inputStyle} />
                
                <label style={{ display: "block", fontSize: "0.7rem", letterSpacing: "2px", color: "#00ff64", marginBottom: "8px", fontWeight: "bold" }}>NEW PASSWORD</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" required style={inputStyle} />
                
                <button type="submit" disabled={loading} style={buttonStyle}>{loading ? "Resetting..." : "Recover & Reset"}</button>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
              <div style={{ width: "80px", height: "80px", background: "rgba(0,255,100,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 24px", color: "#00ff64", border: "2px solid #00ff64", boxShadow: "0 0 30px rgba(0,255,100,0.2)" }}>✓</div>
              <h2 style={{ fontFamily: "Syne", fontSize: "1.8rem", marginBottom: "12px" }}>Access <span style={{ color: "#00ff64" }}>Restored</span></h2>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "30px", fontSize: "0.95rem" }}>Your password has been reset and MFA has been temporarily disabled for your safety.</p>
              <button onClick={() => navigate("/")} style={buttonStyle}>Login Now</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: "30px", textAlign: "center" }}>
           <span onClick={() => navigate("/")} style={{ color: "rgba(0,255,100,0.6)", fontSize: "0.8rem", cursor: "pointer", fontFamily: "JetBrains Mono" }}>← Back to Login</span>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;