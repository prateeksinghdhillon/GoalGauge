import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./navbar.css";
import { useWindowWidth } from "../../utils/utilsFunctions";
import Logo from "../../asstes/logo.png";

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const width = useWindowWidth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img style={{height:"50px"}} src={Logo} alt="" srcset="" />
        {width > 768 ? <h2>GoalGauge</h2> : <></>}
      </div>
      <div className="navbar-links">
        <Link
          to="/"
          className={`navbar-link ${location.pathname === "/" ? "active" : ""}`}
        >
          Dashboard
        </Link>
        <Link
          to="/progress"
          className={`navbar-link ${
            location.pathname === "/progress" ? "active" : ""
          }`}
        >
          Progress
        </Link>
      </div>
      <div className="navbar-profile" ref={dropdownRef}>
        <img
          src={user?.photoURL}
          alt="Profile"
          className="profile-image"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        />

        {isDropdownOpen && (
          <div className="profile-dropdown">
            <div className="user-info">
              <span className="user-name">{user?.displayName}</span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button className="logout-button" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
