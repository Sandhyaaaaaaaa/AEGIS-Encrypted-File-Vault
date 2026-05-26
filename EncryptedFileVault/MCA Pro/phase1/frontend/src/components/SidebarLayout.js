import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Upload', path: '/upload', icon: '📤' },
    { name: 'Files', path: '/myfiles', icon: '📁' },
    { name: 'AI Advisor', path: '/ai-advisor', icon: '🤖' },
  ];

  const sidebarStyle = {
    width: '240px',
    height: '100vh',
    backgroundColor: '#030b03',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    padding: '30px 15px',
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 100
  };

  const navLinkStyle = (path, isAdmin = false) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 18px',
    color: location.pathname === path ? (isAdmin ? '#ffaa00' : '#00ff64') : 'rgba(255, 255, 255, 0.5)',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '700',
    borderRadius: '10px',
    backgroundColor: location.pathname === path ? (isAdmin ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 255, 100, 0.1)') : 'transparent',
    border: location.pathname === path ? (isAdmin ? '1px solid rgba(255, 170, 0, 0.2)' : '1px solid rgba(0, 255, 100, 0.2)') : '1px solid transparent',
    transition: 'all 0.3s',
    marginBottom: '5px'
  });

  return (
    <div style={{ backgroundColor: '#030b03', minHeight: '100vh', color: '#ffffff', fontFamily: '"Syne", sans-serif' }}>
      
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={{ marginBottom: '35px', padding: '0 15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: user?.role === 'admin' ? '#ffaa00' : '#00ff64', boxShadow: user?.role === 'admin' ? '0 0 10px #ffaa00' : '0 0 10px #00ff64' }} />
            <h2 style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '2px', fontWeight: '900' }}>AEGIS</h2>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <p style={{ padding: '0 18px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '15px' }}>NAVIGATION</p>
          
          {mainNavItems.map((item) => (
            <Link key={item.path} to={item.path} style={navLinkStyle(item.path)}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}

          {user?.role === 'admin' && (
            <>
              <p style={{ padding: '20px 18px 10px', fontSize: '0.65rem', color: 'rgba(255,170,0,0.4)', fontWeight: 'bold', letterSpacing: '1px' }}>ADMINISTRATION</p>
              <Link to="/admin" style={navLinkStyle('/admin', true)}>
                <span style={{ fontSize: '1.1rem' }}>👑</span>
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* USER PROFILE SECTION */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '15px', 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              borderRadius: '16px', 
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ width: '35px', height: '35px', borderRadius: '10px', backgroundColor: user?.role === 'admin' ? '#ffaa00' : '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>{user?.username}</p>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.3)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.role?.toUpperCase() || 'USER'}</p>
            </div>
            <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>{showUserMenu ? '▲' : '▼'}</span>
          </div>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{ 
                  position: 'absolute', 
                  bottom: '100%', 
                  left: 0, 
                  right: 0, 
                  marginBottom: '10px', 
                  backgroundColor: '#0a120a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '16px', 
                  padding: '10px',
                  boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
                  zIndex: 200
                }}
              >
                <Link to="/feedback" style={{ display: 'block', padding: '10px', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '8px' }}>✍️ Feedback</Link>
                <Link to="/about" style={{ display: 'block', padding: '10px', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', borderRadius: '8px' }}>ℹ️ About AEGIS</Link>
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />
                <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#ff3366', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>🚪 Sign Out</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ marginLeft: '240px', minHeight: '100vh', padding: '40px' }}>
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;
