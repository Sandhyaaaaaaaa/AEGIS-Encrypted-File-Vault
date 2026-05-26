import React, { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <div className="sidebar-header">
        {isOpen && <h2>Vault Menu</h2>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link to="/upload">Upload</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contactus">Contact</Link>
          </li>
          <li>
            <Link to="/feedback">Feedback</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
