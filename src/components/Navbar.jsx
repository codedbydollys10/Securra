// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { logoutUser } from "../services/authService";
import { listenToNotifications, markNotificationRead } from "../services/firestoreService";
import { Bell, Shield, LogOut, Menu, X, User, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";
import "./Navbar.css";

export default function Navbar() {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const lastNotifCount = useRef(0);
  const isInitial = useRef(true);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToNotifications(user.uid, (newNotifs) => {
      // Trigger pop-up for new unread notifications
      if (!isInitial.current && newNotifs.length > lastNotifCount.current) {
        const latest = newNotifs[0];
        if (!latest.read) {
          toast.success(latest.message, { duration: 6000 });
        }
      }
      isInitial.current = false;
      lastNotifCount.current = newNotifs.length;
      setNotifications(newNotifs);
    });
    return unsub;
  }, [user]);

  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out safely");
    navigate("/role-select");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/map", label: "Live Map" },
    { to: "/report", label: "Report" },
    { to: "/alerts", label: "Alerts" },
    { to: "/assistant", label: "AI Assistant" },
    { to: "/info", label: "Safety Info" },
  ];

  if (profile?.role === "admin") {
    navLinks.push({ to: "/admin", label: "Admin" });
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <Shield size={22} />
          <span>Securra</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="navbar-right">
          {user ? (
            <>
              {/* Theme Toggle */}
              <button
                className="icon-btn theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notifications */}
              <div className="notif-wrapper">
                <button
                  className="icon-btn"
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell size={18} />
                  {unread > 0 && <span className="notif-dot">{unread}</span>}
                </button>
                {notifOpen && (
                  <div className="notif-dropdown">
                    <p className="notif-title">Notifications</p>
                    {notifications.length === 0 ? (
                      <p className="notif-empty">No notifications yet</p>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${!n.read ? "unread" : ""}`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User */}
              <Link to="/profile" className="user-chip">
                <User size={14} />
                <span>{profile?.name || user.displayName || "User"}</span>
              </Link>

              <button className="icon-btn logout-btn" onClick={handleLogout}>
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: "0.4rem 1rem" }}>
              Login
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="icon-btn mobile-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="mobile-nav-link"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <>
              <button
                className="mobile-nav-link theme-toggle-mobile"
                onClick={() => {
                  toggleTheme();
                  setMenuOpen(false);
                }}
              >
                {theme === "dark" ? (
                  <>
                    <Sun size={16} /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon size={16} /> Dark Mode
                  </>
                )}
              </button>
              <button className="mobile-nav-link logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
