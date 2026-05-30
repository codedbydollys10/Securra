// src/pages/RoleSelection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, LogOut, ArrowLeft } from "lucide-react";
import { logoutUser } from "../services/authService";
import toast from "react-hot-toast";
import "./RoleSelection.css";

export default function RoleSelection() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out");
      navigate("/");
    } catch (e) {
      toast.error("Logout failed: " + e.message);
    }
  };

  const handleCitizenMode = () => {
    localStorage.removeItem("authUserType");
    navigate("/");
  };

  const handleAdminMode = () => {
    localStorage.setItem("authUserType", "admin");
    navigate("/admin-login");
  };

  return (
    <div className="role-selection">
      <div className="role-bg" />
      
      <div className="role-container">
        <button
          className="btn-back-role"
          onClick={handleLogout}
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="role-header">
          <Shield size={40} color="var(--orange)" />
          <h1>Choose Your Role</h1>
          <p>Select whether you're a citizen or an administrator</p>
        </div>

        <div className="role-options">
          {/* Citizen Option */}
          <div className="role-card citizen" onClick={handleCitizenMode}>
            <div className="role-icon citizens">
              <Users size={48} />
            </div>
            <h2>Citizen</h2>
            <p className="role-desc">
              Report emergencies, get real-time safety guidance, and track response
            </p>
            <div className="role-features">
              <span>✓ Emergency Reporting</span>
              <span>✓ Live Maps</span>
              <span>✓ AI Safety Guide</span>
              <span>✓ Tracking</span>
            </div>
            <button className="btn btn-primary role-btn">
              Continue as Citizen
            </button>
          </div>

          {/* Administrator Option */}
          <div className="role-card admin" onClick={handleAdminMode}>
            <div className="role-icon administrators">
              <Shield size={48} />
            </div>
            <h2>Administrator</h2>
            <p className="role-desc">
              Manage reports, verify incidents, dispatch emergency services
            </p>
            <div className="role-features">
              <span>✓ Report Verification</span>
              <span>✓ Incident Management</span>
              <span>✓ Emergency Dispatch</span>
              <span>✓ User Management</span>
            </div>
            <button className="btn btn-primary role-btn">
              Login as Administrator
            </button>
          </div>
        </div>

        <div className="role-footer">
          <button
            className="btn btn-ghost logout-role-btn"
            onClick={handleLogout}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
