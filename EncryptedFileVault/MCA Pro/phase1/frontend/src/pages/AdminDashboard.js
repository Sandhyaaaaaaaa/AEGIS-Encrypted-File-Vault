import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getCurrentUser, isAuthenticated, logout } from "../services/authService";
import api from "../config/api";

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
      borderRadius: "16px", padding: "24px", flex: 1,
      boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}15`,
      position: "relative", overflow: "hidden",
    }}
  >
    <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", background: `radial-gradient(circle, ${color}20, transparent)` }} />
    <div style={{ fontSize: "1.6rem", marginBottom: "12px" }}>{icon}</div>
    <div style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.72rem", letterSpacing: "1px", marginBottom: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
    <div style={{ color: "#fff", fontSize: "2rem", fontWeight: "800", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color, fontSize: "0.72rem", marginTop: "6px", fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
  </motion.div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{
    padding: "3px 10px", borderRadius: "20px", fontSize: "0.68rem",
    fontFamily: "'JetBrains Mono', monospace", fontWeight: "600",
    background: `${color}18`, border: `1px solid ${color}40`, color,
  }}>{label}</span>
);

// ─── Action Icon Button ────────────────────────────────────────────────────────
const getActionDisplay = (action) => {
  const displayMap = {
    LOGIN_SUCCESS: "Logged In",
    LOGIN_FAILED: "Login Attempt Failed",
    REGISTER: "New Account Created",
    FILE_UPLOAD: "File Uploaded",
    FILE_DOWNLOAD: "File Downloaded",
    MFA_SETUP: "MFA Setup Initiated",
    MFA_VERIFIED: "MFA Activated",
    MFA_FAILED: "MFA Verification Failed",
    FILE_DELETE: "File Deleted",
    ADMIN_VIEW_LOGS: "Admin: Logs Viewed",
  };
  return displayMap[action] || action.replace(/_/g, " ");
};

const getActionIcon = (action) => {
  const map = {
    LOGIN_SUCCESS: { icon: "✅", color: "#00ff64" },
    LOGIN_FAILED: { icon: "❌", color: "#ff4444" },
    REGISTER: { icon: "👤", color: "#00aaff" },
    FILE_UPLOAD: { icon: "📤", color: "#ffaa00" },
    FILE_DOWNLOAD: { icon: "📥", color: "#00aaff" },
    MFA_SETUP: { icon: "🔐", color: "#aa88ff" },
    MFA_VERIFIED: { icon: "✅", color: "#00ff64" },
    MFA_FAILED: { icon: "⚠️", color: "#ffaa00" },
    FILE_DELETE: { icon: "🗑️", color: "#ff4444" },
    ADMIN_VIEW_LOGS: { icon: "👁️", color: "#888" },
  };
  return map[action] || { icon: "📋", color: "#888" };
};

// ─── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalFiles: 0, totalStorage: 0, failedLogins: 0 });
  const [loading, setLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotalPages, setLogsTotalPages] = useState(1);
  const [searchUser, setSearchUser] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/"); return; }
    if (user?.role !== "admin") { navigate("/dashboard"); return; }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logsPage, filterAction]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchFiles(), fetchLogs(), fetchStats(), fetchFeedback()]);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch (err) { console.error("Failed to fetch users"); }
  };

  const fetchFiles = async () => {
    try {
      const res = await api.get("/admin/files");
      setFiles(res.data);
    } catch (err) { console.error("Failed to fetch files"); }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/logs/all?page=${logsPage}&limit=15${filterAction !== "ALL" ? `&action=${filterAction}` : ""}`);
      setLogs(res.data.logs || []);
      setLogsTotalPages(res.data.totalPages || 1);
    } catch (err) { console.error("Failed to fetch logs"); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) { console.error("Failed to fetch stats"); }
  };

  const fetchFeedback = async () => {
    try {
      const res = await api.get("/feedback");
      setFeedbacks(res.data);
    } catch (err) { console.error("Failed to fetch feedback"); }
  };

  const deleteFeedback = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;
    try {
      await api.delete(`/feedback/${id}`);
      setFeedbacks(feedbacks.filter(f => f._id !== id));
    } catch (err) { console.error("Failed to delete feedback"); }
  };

  const handleLogout = () => { logout(); navigate("/"); };

  const formatSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
  const formatTime = (date) => date ? new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const navItems = [
    { icon: "⬛", label: "User Dashboard", key: "user", path: "/dashboard" },
    { icon: "👑", label: "Admin Overview", key: "overview", badge: "ADMIN" },
    { icon: "👥", label: "All Users", key: "users", badge: users.length || null },
    { icon: "📁", label: "All Files", key: "files", badge: files.length || null },
    { icon: "💬", label: "Feedback", key: "feedback", badge: feedbacks.length || null },
    { icon: "📋", label: "Audit Logs", key: "logs" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030b03", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", border: "3px solid rgba(0,255,100,0.2)", borderTop: "3px solid #00ff64", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "rgba(0,255,100,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem" }}>Loading admin panel...</p>
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
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,255,100,0.2); border-radius: 2px; }
        .table-row:hover { background: rgba(0,255,100,0.04) !important; }
        .search-input:focus { border-color: rgba(0,255,100,0.4) !important; outline: none; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#030b03", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── SIDEBAR ── */}
        <div style={{
          width: "240px", minHeight: "100vh", background: "rgba(4,12,4,0.98)",
          borderRight: "1px solid rgba(0,255,100,0.08)",
          display: "flex", flexDirection: "column", padding: "24px 16px",
          position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", padding: "0 8px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", boxShadow: "0 0 16px rgba(0,255,100,0.4)" }}>🛡️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: "800", color: "#fff", letterSpacing: "3px" }}>Aegis</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.5rem", color: "#ffaa00", letterSpacing: "2px" }}>ADMIN PANEL</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1 }}>
            <div style={{ color: "rgba(0,255,100,0.3)", fontSize: "0.62rem", letterSpacing: "2px", fontFamily: "'JetBrains Mono', monospace", padding: "0 8px", marginBottom: "8px" }}>ADMIN NAVIGATION</div>
            {navItems.map((item) => (
              <SidebarItem key={item.key} icon={item.icon} label={item.label}
                active={activeTab === item.key} badge={item.badge}
                onClick={() => item.path ? navigate(item.path) : setActiveTab(item.key)}
              />
            ))}
          </nav>

          {/* User info */}
          <div style={{ borderTop: "1px solid rgba(0,255,100,0.08)", paddingTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.15)", marginBottom: "8px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #ffaa00, #ff8800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: "700", color: "#000", fontFamily: "'Syne', sans-serif" }}>
                {user?.username?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <div style={{ color: "#fff", fontSize: "0.85rem", fontWeight: "600" }}>{user?.username}</div>
                <div style={{ color: "#ffaa00", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>👑 Administrator</div>
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
                Admin <span style={{ color: "#ffaa00" }}>Panel</span> 👑
              </motion.h1>
              <p style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {["Full Access", "Role: Admin", "Logs: Active"].map((s) => (
                <div key={s} style={{ padding: "6px 12px", background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: "20px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ffaa00", animation: "pulse 2s infinite" }} />
                  <span style={{ color: "rgba(255,170,0,0.7)", fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                {/* Stat Cards */}
                <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
                  <StatCard icon="👥" label="Total Users" value={stats.totalUsers || users.length} sub="Registered accounts" color="#00aaff" delay={0} />
                  <StatCard icon="📁" label="Total Files" value={stats.totalFiles || files.length} sub="Across all users" color="#00ff64" delay={0.1} />
                  <StatCard icon="💾" label="Total Storage" value={formatSize(stats.totalStorage || files.reduce((a, f) => a + (f.size || 0), 0))} sub="All encrypted files" color="#ffaa00" delay={0.2} />
                  <StatCard icon="🚨" label="Failed Logins" value={stats.failedLogins || 0} sub="Last 24 hours" color="#ff4444" delay={0.3} />
                </div>

                {/* Recent Logs + Recent Users */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                  {/* Recent Audit Logs */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700" }}>Recent Activity</h3>
                      <span onClick={() => setActiveTab("logs")} style={{ color: "#00ff64", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>View all →</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {logs.slice(0, 6).map((log, i) => {
                        const { icon } = getActionIcon(log.action);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "rgba(0,255,100,0.02)", border: "1px solid rgba(0,255,100,0.06)", borderRadius: "10px" }}>
                            <span style={{ fontSize: "1rem" }}>{icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: "rgba(200,230,200,0.8)", fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{log.username} — {getActionDisplay(log.action)}</div>
                              <div style={{ color: "rgba(0,255,100,0.3)", fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace", marginTop: "2px" }}>{formatDate(log.createdAt)} {formatTime(log.createdAt)}</div>
                            </div>
                            <Badge label={log.status} color={log.status === "SUCCESS" ? "#00ff64" : log.status === "FAILED" ? "#ff4444" : "#ffaa00"} />
                          </div>
                        );
                      })}
                      {logs.length === 0 && <p style={{ color: "rgba(150,200,150,0.3)", fontSize: "0.82rem", textAlign: "center", padding: "20px" }}>No logs yet</p>}
                    </div>
                  </motion.div>

                  {/* Recent Users */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                      <h3 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1rem", fontWeight: "700" }}>Recent Users</h3>
                      <span onClick={() => setActiveTab("users")} style={{ color: "#00ff64", fontSize: "0.75rem", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>View all →</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {users.slice(0, 6).map((u, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", background: "rgba(0,255,100,0.02)", border: "1px solid rgba(0,255,100,0.06)", borderRadius: "10px" }}>
                          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg, #ffaa00, #ff8800)" : "linear-gradient(135deg, #00cc44, #00ff64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: "700", color: "#000", fontFamily: "'Syne', sans-serif", flexShrink: 0 }}>
                            {u.username?.[0]?.toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "rgba(200,230,200,0.9)", fontSize: "0.85rem", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.username}</div>
                            <div style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
                            <Badge label={u.role?.toUpperCase()} color={u.role === "admin" ? "#ffaa00" : "#00aaff"} />
                            <Badge label={u.mfaEnabled ? "MFA ON" : "MFA OFF"} color={u.mfaEnabled ? "#00ff64" : "#ff4444"} />
                          </div>
                        </div>
                      ))}
                      {users.length === 0 && <p style={{ color: "rgba(150,200,150,0.3)", fontSize: "0.82rem", textAlign: "center", padding: "20px" }}>No users found</p>}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ── USERS TAB ── */}
            {activeTab === "users" && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1.3rem", fontWeight: "700" }}>All Users <span style={{ color: "#00ff64" }}>({users.length})</span></h2>
                  <input className="search-input" placeholder="Search by name or email..."
                    value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
                    style={{ padding: "10px 16px", background: "rgba(0,255,100,0.05)", border: "1px solid rgba(0,255,100,0.15)", borderRadius: "10px", color: "#e2ffe8", fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif", width: "280px", transition: "all 0.2s" }}
                  />
                </div>

                <div style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", overflow: "hidden" }}>
                  {/* Table Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 2.5fr 1fr 1fr 1.2fr", padding: "14px 20px", borderBottom: "1px solid rgba(0,255,100,0.08)", background: "rgba(0,255,100,0.03)" }}>
                    {["Username", "Email", "Role", "MFA", "Joined"].map((h) => (
                      <span key={h} style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
                    ))}
                  </div>

                  {/* Table Rows */}
                  {filteredUsers.map((u, i) => (
                    <motion.div key={i} className="table-row"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ display: "grid", gridTemplateColumns: "2fr 2.5fr 1fr 1fr 1.2fr", padding: "14px 20px", borderBottom: "1px solid rgba(0,255,100,0.05)", alignItems: "center", transition: "background 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg, #ffaa00, #ff8800)" : "linear-gradient(135deg, #00cc44, #00ff64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "700", color: "#000", flexShrink: 0 }}>
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ color: "rgba(200,230,200,0.9)", fontSize: "0.85rem" }}>{u.username}</span>
                      </div>
                      <span style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                      <Badge label={u.role?.toUpperCase()} color={u.role === "admin" ? "#ffaa00" : "#00aaff"} />
                      <Badge label={u.mfaEnabled ? "MFA ON" : "MFA OFF"} color={u.mfaEnabled ? "#00ff64" : "#ff4444"} />
                      <span style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(u.createdAt)}</span>
                    </motion.div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "rgba(150,200,150,0.3)", fontSize: "0.88rem" }}>No users found</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── FILES TAB ── */}
            {activeTab === "files" && (
              <motion.div key="files" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1.3rem", fontWeight: "700", marginBottom: "20px" }}>All Files <span style={{ color: "#00ff64" }}>({files.length})</span></h2>

                <div style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 1fr 1.5fr", padding: "14px 20px", borderBottom: "1px solid rgba(0,255,100,0.08)", background: "rgba(0,255,100,0.03)" }}>
                    {["Filename", "Owner", "Size", "Uploaded"].map((h) => (
                      <span key={h} style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
                    ))}
                  </div>

                  {files.map((f, i) => (
                    <motion.div key={i} className="table-row"
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ display: "grid", gridTemplateColumns: "2.5fr 2fr 1fr 1.5fr", padding: "14px 20px", borderBottom: "1px solid rgba(0,255,100,0.05)", alignItems: "center", transition: "background 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(0,255,100,0.1)", border: "1px solid rgba(0,255,100,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0 }}>📄</div>
                        <span style={{ color: "rgba(200,230,200,0.9)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.filename || "Unknown"}</span>
                      </div>
                      <span style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.owner?.username || f.owner || "Unknown"}</span>
                      <span style={{ color: "rgba(150,200,150,0.6)", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>{formatSize(f.size)}</span>
                      <span style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(f.createdAt)}</span>
                    </motion.div>
                  ))}
                  {files.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "rgba(150,200,150,0.3)", fontSize: "0.88rem" }}>No files found</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── FEEDBACK TAB ── */}
            {activeTab === "feedback" && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1.3rem", fontWeight: "700", marginBottom: "20px" }}>User Feedback <span style={{ color: "#00ff64" }}>({feedbacks.length})</span></h2>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" }}>
                  {feedbacks.map((f, i) => (
                    <motion.div key={f._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "20px", padding: "24px", position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <div style={{ color: "#fff", fontWeight: "700", fontSize: "1rem" }}>{f.name}</div>
                          <div style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>{f.email}</div>
                        </div>
                        <button onClick={() => deleteFeedback(f._id)} style={{ background: "transparent", border: "none", color: "#ff4444", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}>🗑️</button>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px", background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {f.message}
                      </p>
                      <div style={{ color: "rgba(150,200,150,0.3)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>
                        Submitted: {formatDate(f.createdAt)} {formatTime(f.createdAt)}
                      </div>
                    </motion.div>
                  ))}
                  {feedbacks.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "rgba(150,200,150,0.3)", fontSize: "0.88rem", gridColumn: "1 / -1" }}>No feedback received yet</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── LOGS TAB ── */}
            {activeTab === "logs" && (
              <motion.div key="logs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", color: "#fff", fontSize: "1.3rem", fontWeight: "700" }}>Audit Logs</h2>
                  <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setLogsPage(1); }}
                    style={{ padding: "10px 16px", background: "rgba(0,255,100,0.05)", border: "1px solid rgba(0,255,100,0.15)", borderRadius: "10px", color: "#e2ffe8", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer" }}>
                    {["ALL", "LOGIN_SUCCESS", "LOGIN_FAILED", "REGISTER", "FILE_UPLOAD", "FILE_DOWNLOAD", "MFA_SETUP", "MFA_VERIFIED", "MFA_FAILED"].map(a => (
                      <option key={a} value={a} style={{ background: "#030b03" }}>{a === "ALL" ? "All Activities" : getActionDisplay(a)}</option>
                    ))}
                  </select>
                </div>

                <div style={{ background: "rgba(4,12,4,0.8)", border: "1px solid rgba(0,255,100,0.1)", borderRadius: "16px", overflow: "hidden", marginBottom: "16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 2fr 2.5fr 1fr 1.2fr", padding: "14px 20px", borderBottom: "1px solid rgba(0,255,100,0.08)", background: "rgba(0,255,100,0.03)" }}>
                    {["User", "Action", "Details", "IP Address", "Status", "Time"].map((h) => (
                      <span key={h} style={{ color: "rgba(0,255,100,0.5)", fontSize: "0.7rem", letterSpacing: "1px", fontFamily: "'JetBrains Mono', monospace" }}>{h}</span>
                    ))}
                  </div>

                  {logs.map((log, i) => {
                    const { icon } = getActionIcon(log.action);
                    return (
                      <motion.div key={i} className="table-row"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 2fr 2.5fr 1fr 1.2fr", padding: "12px 20px", borderBottom: "1px solid rgba(0,255,100,0.05)", alignItems: "center", transition: "background 0.2s" }}>
                        <span style={{ color: "rgba(200,230,200,0.8)", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.username || "Unknown"}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{icon}</span>
                          <span style={{ color: getActionIcon(log.action).color, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getActionDisplay(log.action)}</span>
                        </div>
                        <span style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.details || "—"}</span>
                        <span style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace" }}>{log.ipAddress || "—"}</span>
                        <Badge label={log.status} color={log.status === "SUCCESS" ? "#00ff64" : log.status === "FAILED" ? "#ff4444" : "#ffaa00"} />
                        <span style={{ color: "rgba(150,200,150,0.4)", fontSize: "0.72rem", fontFamily: "'JetBrains Mono', monospace" }}>{formatDate(log.createdAt)}</span>
                      </motion.div>
                    );
                  })}
                  {logs.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "rgba(150,200,150,0.3)", fontSize: "0.88rem" }}>No logs found</div>
                  )}
                </div>

                {/* Pagination */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={logsPage === 1}
                    onClick={() => setLogsPage(p => p - 1)}
                    style={{ padding: "8px 18px", background: logsPage === 1 ? "rgba(255,255,255,0.03)" : "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: "8px", color: logsPage === 1 ? "rgba(150,200,150,0.3)" : "#00ff64", cursor: logsPage === 1 ? "not-allowed" : "pointer", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    Previous
                  </motion.button>
                  <span style={{ color: "rgba(150,200,150,0.5)", fontSize: "0.78rem", fontFamily: "'JetBrains Mono', monospace" }}>Page {logsPage} of {logsTotalPages}</span>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    disabled={logsPage === logsTotalPages}
                    onClick={() => setLogsPage(p => p + 1)}
                    style={{ padding: "8px 18px", background: logsPage === logsTotalPages ? "rgba(255,255,255,0.03)" : "rgba(0,255,100,0.08)", border: "1px solid rgba(0,255,100,0.2)", borderRadius: "8px", color: logsPage === logsTotalPages ? "rgba(150,200,150,0.3)" : "#00ff64", cursor: logsPage === logsTotalPages ? "not-allowed" : "pointer", fontSize: "0.82rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    Next
                  </motion.button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;