import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getMyFiles } from "../services/fileService";
import { getCurrentUser, isAuthenticated, logout } from "../services/authService";
import api from "../config/api";

// ─── Map action to display ─────────────────────────────────────────────────────
const getActionDisplay = (action, details) => {
  const map = {
    LOGIN_SUCCESS:  { icon: "✅", text: "Logged in" },
    LOGIN_FAILED:   { icon: "❌", text: "Login failed" },
    FILE_UPLOAD:    { icon: "🔒", text: details?.replace("Uploaded file: ", "") || "File saved" },
    FILE_DOWNLOAD:  { icon: "📥", text: details?.replace("Downloaded file: ", "") || "File downloaded" },
    FILE_DELETE:    { icon: "🗑️", text: "File deleted" },
    MFA_SETUP:      { icon: "🔐", text: "Security setup" },
    MFA_VERIFIED:   { icon: "✅", text: "Security enabled" },
    MFA_FAILED:     { icon: "⚠️", text: "Wrong code entered" },
    REGISTER:       { icon: "👤", text: "Account created" },
  };
  return map[action] || { icon: "📋", text: action?.replace(/_/g, " ") || "Action" };
};

// ─── Time ago helper ───────────────────────────────────────────────────────────
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return new Date(date).toLocaleDateString();
};


// ─── Sidebar Item ──────────────────────────────────────────────────────────────
const SidebarItem = ({ icon, label, active, onClick, badge }) => (
  <motion.div
    whileHover={{ x: 4 }}
    onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: "12px",
      padding: "11px 16px", borderRadius: "10px", cursor: "pointer",
      background: active ? "rgba(0,255,100,0.1)" : "transparent",
      border: active ? "1px solid rgba(0,255,100,0.2)" : "1px solid transparent",
      marginBottom: "4px", transition: "all 0.2s",
    }}
  >
    <span style={{ fontSize: "1.1rem" }}>{icon}</span>
    <span style={{ color: active ? "#00ff64" : "rgba(180,220,180,0.6)", fontSize: "0.88rem", fontWeight: active ? "600" : "400", fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
    {badge && <span style={{ marginLeft: "auto", background: "rgba(0,255,100,0.2)", color: "#00ff64", fontSize: "0.65rem", padding: "2px 7px", borderRadius: "10px", fontFamily: "'JetBrains Mono', monospace" }}>{badge}</span>}
  </motion.div>
);

// ─── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ y: -4 }}
    style={{
      background: "rgba(4,12,4,0.8)", border: `1px solid ${color}30`,
      borderRadius: "16px", padding: "24px",
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}15`,
      position: "relative", overflow: "hidden", flex: 1,
    }}
  >
    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${color}20, transparent)` }} />
    <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>{icon}</div>
    <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.75rem", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    <div style={{ color: "#fff", fontSize: "2rem", fontWeight: "800", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: color, fontSize: "0.75rem", marginTop: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
  </motion.div>
);


// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(4,12,4,0.95)", border: "1px solid rgba(0,255,100,0.3)", borderRadius: "8px", padding: "8px 14px" }}>
        <p style={{ color: "#00ff64", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>{label}: {payload[0].value} files</p>
      </div>
    );
  }
  return null;
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weekData, setWeekData] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [failedLogins, setFailedLogins] = useState(0);

  const navigate = useNavigate();
  const user = getCurrentUser();

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/logs/stats");
      setWeekData(res.data);
    } catch (err) {
      setWeekData([
        { day: "Mon", files: 0 }, { day: "Tue", files: 0 }, { day: "Wed", files: 0 },
        { day: "Thu", files: 0 }, { day: "Fri", files: 0 }, { day: "Sat", files: 0 }, { day: "Sun", files: 0 },
      ]);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get("/logs/my");
      setFeedItems(res.data);
      // ✅ Count failed logins from logs
      const failed = res.data.filter(l => l.action === "LOGIN_FAILED").length;
      setFailedLogins(failed);
    } catch (err) {
      setFeedItems([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/"); return; }
    const fetchFiles = async () => {
      try {
        const data = await getMyFiles();
        setFiles(data);
      } catch (err) {
        console.error("Failed to load files");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
    fetchStats();
    fetchFeed();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleLogout = () => { logout(); navigate("/"); };

  const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
  const formatSize = (bytes) => bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;


  // ✅ Real status pills
  const statusPills = [
    { label: "System Active", active: true, color: "#00ff64" },
    { label: user?.mfaEnabled ? "Double Security On" : "Double Security Off", active: user?.mfaEnabled, color: user?.mfaEnabled ? "#00ff64" : "#ff4444" },
    { label: failedLogins === 0 ? "Vault Secure" : `${failedLogins} Failed Login${failedLogins > 1 ? "s" : ""}`, active: failedLogins === 0, color: failedLogins === 0 ? "#00ff64" : "#ff4444" },
  ];

  const greeting = () => {
    const h = currentTime.getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const navItems = [
    { icon: "⬛", label: "Dashboard", key: "dashboard", path: "/dashboard" },
    { icon: "📤", label: "Upload File", key: "upload", path: "/upload" },
    { icon: "📁", label: "My Files", key: "files", path: "/myfiles", badge: files.length || null },
    { icon: "🤝", label: "Sharing", key: "shared", path: "/shared" },
    { icon: "🤖", label: "Advisor", key: "ai", path: "/ai-advisor" },
    { icon: "💬", label: "Feedback", key: "feedback", path: "/feedback" },
    { icon: "ℹ️", label: "About", key: "about", path: "/about" },
  ];

  if (user?.role === "admin") {
    navItems.push({ icon: "👑", label: "Admin Panel", key: "admin", path: "/admin", badge: "ADMIN" });
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030b03", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid rgba(0,255,100,0.2)", borderTop: "3px solid #00ff64", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(0,255,100,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,100,0.2); border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#030b03", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: "240px", minHeight: "100vh", background: "rgba(4,12,4,0.98)",
          borderRight: "1px solid rgba(0,255,100,0.08)",
          display: "flex", flexDirection: "column", padding: "24px 16px",
          position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", padding: "0 8px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", boxShadow: "0 0 16px rgba(0,255,100,0.4)" }}>🛡️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: "800", color: "#fff", letterSpacing: "3px" }}>Aegis</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "rgba(0,255,100,0.5)", letterSpacing: "2px" }}>Secure Vault</div>
            </div>
          </div>

          <nav style={{ flex: 1 }}>
            <div style={{ color: "rgba(0,255,100,0.3)", fontSize: "0.62rem", letterSpacing: "2px", fontFamily: "'JetBrains Mono', monospace", padding: "0 8px", marginBottom: "8px" }}>NAVIGATION</div>
            {navItems.map((item) => (
              <SidebarItem key={item.key} icon={item.icon} label={item.label}
                active={activePage === item.key} badge={item.badge}
                onClick={() => { setActivePage(item.key); navigate(item.path); }}
              />
            ))}
          </nav>

          <div style={{ borderTop: "1px solid rgba(0,255,100,0.08)", paddingTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "rgba(0,255,100,0.05)", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #00cc44, #00ff64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "700", color: "#000", fontFamily: "'Syne', sans-serif" }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.username}</div>
                <div style={{ color: "rgba(0,255,100,0.4)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>{user?.role === "admin" ? "👑 Admin" : "User"}</div>
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              style={{ width: "100%", padding: "9px", background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.2)", borderRadius: "8px", color: "rgba(255,100,100,0.7)", fontSize: "0.82rem", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              Sign Out
            </motion.button>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ marginLeft: "240px", flex: 1, padding: "32px", overflowY: "auto" }}>

          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <div>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                style={{ fontFamily: "'Syne', sans-serif", fontSize: "1.7rem", fontWeight: "800", color: "#fff", marginBottom: "4px" }}>
                {greeting()}, <span style={{ color: "#00ff64" }}>{user?.username}</span> 👋
              </motion.h1>
              <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
                {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* ✅ Real Status Pills */}
            <div style={{ display: "flex", gap: "10px" }}>
              {statusPills.map((s) => (
                <div key={s.label} style={{ padding: "6px 12px", background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: s.color, animation: "pulse 2s infinite" }} />
                  <span style={{ color: `${s.color}CC`, fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
            <StatCard icon="📁" label="Total Files" value={files.length} sub="Files in vault" color="#00ff64" delay={0} />
            <StatCard icon="🔒" label="Secured Files" value={files.length} sub="High Security" color="#00aaff" delay={0.1} />
            <StatCard icon="💾" label="Vault Size" value={files.length > 0 ? formatSize(totalSize) : "0 KB"} sub="Total size" color="#ffaa00" delay={0.2} />

          </div>

          {/* ── CHART + VAULT FEED ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "24px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700" }}>File Activity</h3>
                  <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>Files secured this week</p>
                </div>
                <div style={{ padding: "4px 12px", background: "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: "20px", color: "#00ff64", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>This Week</div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData} barSize={28}>
                  <XAxis dataKey="day" tick={{ fill: "rgba(150,200,150,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(150,200,150,0.4)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,255,100,0.05)" }} />
                  <Bar dataKey="files" fill="#00ff64" radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "28px" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700", marginBottom: "4px" }}>Recent Activity</h3>
              <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "20px" }}>Recent actions in your vault</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {feedItems.length > 0 ? feedItems.map((item, i) => {
                  const { icon, text } = getActionDisplay(item.action, item.details);
                  return (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.08 }}
                      style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", background: "rgba(0,255,100,0.03)", border: "1px solid rgba(0,255,100,0.06)", borderRadius: "10px" }}>
                      <span style={{ fontSize: "1rem" }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "rgba(200,230,200,0.8)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
                        <div style={{ color: "rgba(0,255,100,0.35)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>{timeAgo(item.createdAt)}</div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div style={{ textAlign: "center", padding: "24px", color: "rgba(150,200,150,0.3)", fontSize: "0.82rem" }}>No activity yet. Upload your first file!</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── QUICK ACTIONS + RECENT FILES ── */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "28px" }}>
              <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700", marginBottom: "20px" }}>Quick Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { icon: "📤", label: "Upload File", path: "/upload" },
                  { icon: "📁", label: "My Files", path: "/myfiles" },
                  { icon: "🤖", label: "Advisor", path: "/ai-advisor" },
                ].map((action) => (
                  <motion.button key={action.label}
                    whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(action.path)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", cursor: "pointer", width: "100%", textAlign: "left" }}>
                    <span style={{ fontSize: "1.1rem" }}>{action.icon}</span>
                    <span style={{ color: "rgba(200,230,200,0.8)", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>{action.label}</span>
                    <span style={{ marginLeft: "auto", color: "rgba(150,200,150,0.3)", fontSize: "0.8rem" }}>→</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700" }}>Recent Files</h3>
                <span onClick={() => navigate("/myfiles")} style={{ color: "#00ff64", fontSize: "0.78rem", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>View all →</span>
              </div>
              {files.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "rgba(150,200,150,0.3)", fontSize: "0.88rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "12px" }}>📭</div>
                  No files yet. Upload your first file!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {files.slice(0, 5).map((file, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.06 }}
                      style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "rgba(0,255,100,0.03)", border: "1px solid rgba(0,255,100,0.06)", borderRadius: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "9px", background: "rgba(0,255,100,0.1)", border: "1px solid rgba(0,255,100,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>📄</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "rgba(200,230,200,0.9)", fontSize: "0.85rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {file.filename || file.name || "Secured file"}
                        </div>
                        <div style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>
                          {file.size ? formatSize(file.size) : "—"} · {file.createdAt ? new Date(file.createdAt).toLocaleDateString() : "Recently"}
                        </div>
                      </div>
                      <div style={{ padding: "4px 10px", background: "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: "6px", color: "#00ff64", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>
                        Secure
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;