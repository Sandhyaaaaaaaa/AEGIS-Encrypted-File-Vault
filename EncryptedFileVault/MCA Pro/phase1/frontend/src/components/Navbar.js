import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { logout, isAuthenticated, getCurrentUser } from "../services/authService";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuth = isAuthenticated();
  const user = getCurrentUser();
  const isLoginPage = location.pathname === "/" || location.pathname === "/register" || location.pathname === "/mfa-setup";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (isLoginPage) return null;

  const mainLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Files", path: "/myfiles" },
    { label: "Upload", path: "/upload" },
    { label: "Sharing", path: "/shared" },
    { label: "Advisor", path: "/ai-advisor" },
  ];

  const dropdownLinks = [
    { icon: "⚙️", label: "Settings", path: "/settings" },
    { icon: "ℹ️", label: "About", path: "/about" },
    { icon: "📬", label: "Contact", path: "/contact" },
    { icon: "💬", label: "Feedback", path: "/feedback" },
  ];

  if (user?.role === "admin") {
    dropdownLinks.unshift({ icon: "👑", label: "Admin Panel", path: "/admin" });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;700&display=swap');
      `}</style>

      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(3,11,3,0.92)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,255,100,0.08)",
        padding: "0 32px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* ── LOGO ── */}
        <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #00ff64, #00cc44)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", boxShadow: "0 0 12px rgba(0,255,100,0.3)" }}>🛡️</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: "0.95rem", fontWeight: "800", color: "#fff", letterSpacing: "3px" }}>AEGIS</span>
        </Link>

        {/* ── MAIN NAV LINKS ── */}
        {isAuth && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {mainLinks.map((link) => (
              <Link key={link.path} to={link.path} style={{ textDecoration: "none" }}>
                <motion.div whileHover={{ y: -1 }}
                  style={{
                    padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
                    background: isActive(link.path) ? "rgba(0,255,100,0.1)" : "transparent",
                    border: isActive(link.path) ? "1px solid rgba(0,255,100,0.2)" : "1px solid transparent",
                    color: isActive(link.path) ? "#00ff64" : "rgba(180,220,180,0.6)",
                    fontSize: "0.88rem", fontWeight: isActive(link.path) ? "600" : "400",
                    transition: "all 0.2s",
                  }}>
                  {link.label}
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {/* ── RIGHT — User dropdown ── */}
        {isAuth && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", position: "relative" }} ref={dropdownRef}>

            {/* User avatar button */}
            <motion.div whileHover={{ scale: 1.02 }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", borderRadius: "10px", cursor: "pointer", background: dropdownOpen ? "rgba(0,255,100,0.1)" : "rgba(0,255,100,0.05)", border: "1px solid rgba(0,255,100,0.15)" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: "linear-gradient(135deg, #00cc44, #00ff64)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", color: "#000", fontFamily: "'Syne', sans-serif" }}>
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
              <span style={{ color: "rgba(200,230,200,0.8)", fontSize: "0.85rem", fontWeight: "500" }}>{user?.username}</span>
              <span style={{ color: "rgba(0,255,100,0.4)", fontSize: "0.7rem", transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block" }}>▼</span>
            </motion.div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute", top: "52px", right: 0,
                    background: "rgba(4,12,4,0.98)", border: "1px solid rgba(0,255,100,0.15)",
                    borderRadius: "14px", padding: "8px", minWidth: "210px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 300,
                  }}>

                  {/* User info header */}
                  <div style={{ padding: "10px 12px", marginBottom: "6px", borderBottom: "1px solid rgba(0,255,100,0.08)" }}>
                    <div style={{ color: "#fff", fontSize: "0.88rem", fontWeight: "600" }}>{user?.username}</div>
                    <div style={{ color: "rgba(0,255,100,0.4)", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace" }}>
                      {user?.role === "admin" ? "👑 Admin" : "👤 User"}
                    </div>
                  </div>

                  {/* Dropdown links */}
                  {dropdownLinks.map((link) => (
                    <Link key={link.path} to={link.path} style={{ textDecoration: "none" }}
                      onClick={() => setDropdownOpen(false)}>
                      <motion.div whileHover={{ x: 4, background: "rgba(0,255,100,0.06)" }}
                        style={{
                          display: "flex", alignItems: "center", gap: "10px",
                          padding: "9px 12px", borderRadius: "8px", cursor: "pointer",
                          background: isActive(link.path) ? "rgba(0,255,100,0.08)" : "transparent",
                        }}>
                        <span style={{ fontSize: "0.9rem" }}>{link.icon}</span>
                        <span style={{ color: isActive(link.path) ? "#00ff64" : "rgba(180,220,180,0.7)", fontSize: "0.85rem" }}>{link.label}</span>
                        {isActive(link.path) && <span style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: "#00ff64" }} />}
                      </motion.div>
                    </Link>
                  ))}

                  {/* Divider */}
                  <div style={{ borderTop: "1px solid rgba(0,255,100,0.08)", margin: "6px 0" }} />

                  {/* Logout */}
                  <motion.div whileHover={{ x: 4, background: "rgba(255,50,50,0.08)" }}
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", borderRadius: "8px", cursor: "pointer" }}>
                    <span style={{ fontSize: "0.9rem" }}>🚪</span>
                    <span style={{ color: "rgba(255,100,100,0.7)", fontSize: "0.85rem" }}>Sign Out</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;