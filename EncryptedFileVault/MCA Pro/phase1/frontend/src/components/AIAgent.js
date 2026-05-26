import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';



const AIAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Random Greeting on Load
  useEffect(() => {
    const greetings = [
      "Welcome back! I'm here to help.",
      "Your vault is secure. What can I do for you?",
      "Aegis Advisor is online. Ask me anything!"
    ];
    const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
    setMessages([{ sender: 'ai', text: randomGreet, timestamp: new Date() }]);
  }, []);

  const quickQuestions = [
    { icon: "🔑", text: "Encryption?", prompt: "How does the encryption work?" },
    { icon: "🛡️", text: "Safe?", prompt: "Is my data safe?" },
    { icon: "📤", text: "Upload", prompt: "Open the upload page" },
    { icon: "📁", text: "My Files", prompt: "Show my files" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);



  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    const userMessage = { sender: 'user', text: textToSend, timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // 🚀 Call backend OpenAI API
      const response = await api.post('/ai/chat', {
        message: textToSend,
        history: messages.map(msg => ({
          sender: msg.sender,
          text: msg.text
        }))
      });

      const { message, action } = response.data;

      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: message || "I'm having a little trouble connecting. Please try again.", 
        timestamp: new Date() 
      }]);

      if (action) {
        executeAction(action);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "I can't connect right now. Please check if the OpenAI key is set in the .env file.", 
        timestamp: new Date() 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = (action) => {
    console.log("Local AI Action:", action);
    switch (action.type) {
      case 'NAVIGATE':
        setTimeout(() => navigate(action.payload.path), 1000);
        break;
      case 'FILTER_FILES':
        setTimeout(() => navigate(`/myfiles?filter=${action.payload.fileType}`), 1000);
        break;
      default:
        console.warn("Unhandled action:", action.type);
    }
  };

  return (
    <>
      <style>{`
        .ai-chat-scroll::-webkit-scrollbar { width: 5px; }
        .ai-chat-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .ai-chat-scroll::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.3); border-radius: 10px; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Floating Button */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '70px', height: '70px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', cursor: 'pointer', zIndex: 1000,
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
          border: '2px solid rgba(255,255,255,0.2)',
          animation: 'float 4s ease-in-out infinite'
        }}
      >
        {isOpen ? '✕' : '🧠'}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: '110px', right: '30px',
              width: '420px', maxHeight: '650px', height: '80vh',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '24px',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              zIndex: 1000, overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '24px', background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'Syne' }}>Aegis Advisor</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'JetBrains Mono', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '8px', height: '8px', background: '#00ff64', borderRadius: '50%', boxShadow: '0 0 8px #00ff64' }}></span>
                  Advisor Active
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* Messages */}
            <div className="ai-chat-scroll" ref={scrollRef} style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  style={{ 
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '14px 18px',
                    borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.sender === 'user' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(30, 41, 59, 0.8)',
                    border: msg.sender === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '0.9rem', lineHeight: 1.6,
                    boxShadow: msg.sender === 'user' ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
                    position: 'relative'
                  }}>
                  {msg.text}
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '6px' }}>
                    {msg.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.8)', padding: '14px 18px', borderRadius: '20px 20px 20px 4px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }}>Thinking...</motion.span>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div style={{ padding: '0 24px 15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {quickQuestions.map((q, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.05, background: 'rgba(59, 130, 246, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend(q.prompt)}
                  style={{ padding: '8px 14px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{q.icon}</span> {q.text}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(15, 23, 42, 0.98)' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about encryption, security..."
                  style={{
                    width: '100%', padding: '16px 20px', paddingRight: '60px',
                    background: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '16px', color: '#fff', outline: 'none',
                    fontSize: '0.9rem', transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)'}
                />
                <button 
                  onClick={() => handleSend()}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  🚀
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAgent;
