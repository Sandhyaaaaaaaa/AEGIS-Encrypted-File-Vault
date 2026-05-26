import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GlobalAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Aegis Advisor. How can I help you with your vault today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const knowledgeBase = {
    "encryption": "We use a very strong locking system to keep your files safe. It's the same kind of security that big banks use to protect data.",
    "master key": "Your secret phrase is used to create a special key that locks and unlocks your files. This key stays only on your device and is never sent to us.",
    "zero knowledge": "We don't have any way to see your data. Your files are locked on your computer before they are even uploaded to us.",
    "rsa": "We use a secure sharing system so you can let your friends see your files without ever sharing your main password.",
    "b2": "Your locked files are stored safely in the cloud. They are stored in a way that is extra safe and reliable.",
    "recovery": "If you lose your secret phrase, you can use your backup key or your security PIN to get your files back."
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let response = "I'm looking into that for you. You can ask me about 'encryption', 'sharing', or 'recovery'.";
      const lowInput = userMsg.toLowerCase();
      
      for (const key in knowledgeBase) {
        if (lowInput.includes(key)) {
          response = knowledgeBase[key];
          break;
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: "fixed", bottom: "30px", right: "30px", width: "65px", height: "65px", borderRadius: "22px", background: "var(--emerald-neon)", color: "#000", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", boxShadow: "0 10px 30px var(--emerald-glow)", zIndex: 1000 }}>
        {isOpen ? "✕" : "🤖"}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ position: "fixed", bottom: "110px", right: "30px", width: "400px", height: "550px", background: "var(--bg-obsidian-glass)", backdropFilter: "blur(24px)", border: "1px solid var(--emerald-border)", borderRadius: "32px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.8)", zIndex: 1000 }}>
            
            {/* Chat Header */}
            <div style={{ padding: "24px", background: "rgba(0, 255, 102, 0.05)", borderBottom: "1px solid var(--glass-border)", display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--emerald-neon)", boxShadow: "0 0 10px var(--emerald-neon)" }} />
              <div>
                <div className="syne" style={{ color: "#fff", fontWeight: "800", fontSize: "1rem" }}>Aegis Advisor</div>
                <div className="mono" style={{ fontSize: "0.6rem", color: "var(--emerald-neon)", letterSpacing: "1px" }}>ADVISOR ACTIVE</div>
              </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: m.role === "user" ? 20 : -20 }} animate={{ opacity: 1, x: 0 }}
                  style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                  <div style={{ padding: "14px 18px", borderRadius: m.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px", background: m.role === "user" ? "var(--emerald-neon)" : "rgba(255,255,255,0.03)", color: m.role === "user" ? "#000" : "#fff", fontSize: "0.9rem", lineHeight: 1.5, border: m.role === "user" ? "none" : "1px solid var(--glass-border)", boxShadow: m.role === "user" ? "0 5px 15px var(--emerald-glow)" : "none" }}>
                    {m.content}
                  </div>
                  <div className="mono" style={{ fontSize: "0.6rem", color: "var(--text-secondary)", marginTop: "6px", textAlign: m.role === "user" ? "right" : "left" }}>
                    {m.role === "user" ? "ME" : "ADVISOR"}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.03)", padding: "12px 18px", borderRadius: "20px", display: "flex", gap: "5px" }}>
                  {[0, 1, 2].map(d => <motion.div key={d} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.2 }} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--emerald-neon)" }} />)}
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{ padding: "20px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid var(--glass-border)" }}>
              <div style={{ position: "relative" }}>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..."
                  style={{ width: "100%", padding: "16px 50px 16px 20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)", borderRadius: "16px", color: "#fff", outline: "none", fontSize: "0.9rem" }} />
                <button type="submit" disabled={!input.trim()}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", borderRadius: "10px", background: input.trim() ? "var(--emerald-neon)" : "rgba(255,255,255,0.05)", color: "#000", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ↑
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalAIChatbot;
