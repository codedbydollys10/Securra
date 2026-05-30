// src/components/AdminNavbar.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { logoutUser } from "../services/authService";
import toast from "react-hot-toast";
import "./AdminNavbar.css";

export default function AdminNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out!");
      navigate("/role-select");
    } catch (e) {
      toast.error("Logout failed: " + e.message);
    }
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-brand">
        <h2>SECURRA</h2>
        <span className="admin-badge">Admin Panel</span>
      </div>

      <div className="admin-navbar-nav">
        <button
          className={`navbar-link active`}
          onClick={() => navigate("/admin")}
        >
          📊 Admin Dashboard
        </button>
      </div>

      <div className="admin-navbar-actions">
        <button
          className="btn-logout"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
