// src/pages/AdminLogin.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { getUser } from "../services/firestoreService";
import { Shield, Eye, EyeOff, Loader, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    // Set auth user type to admin for this flow
    localStorage.setItem("authUserType", "admin");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password required");
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(form.email, form.password);
      const profile = await getUser(user.uid);

      if (profile?.role !== "admin") {
        toast.error("You don't have admin access");
        return;
      }

      toast.success("Welcome back, Admin!");
      navigate("/admin");
    } catch (e) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-bg" />

      <div className="admin-login-container">
        <button
          className="btn-back-admin-login"
          onClick={() => navigate("/role-select")}
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="admin-login-icon">
              <Shield size={48} color="var(--orange)" />
            </div>
            <h1>Admin Login</h1>
            <p>Access the administration dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="admin@securra.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(!showPass)}
                  disabled={loading}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary admin-login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spinner" /> Logging In...
                </>
              ) : (
                <>
                  <Shield size={16} /> Login as Administrator
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer">
            <p>
              Want to switch roles? <Link to="/role-select">Go back</Link>
            </p>
          </div>
        </div>

        <div className="admin-login-info">
          <div className="info-box">
            <span className="info-icon">🔒</span>
            <span>Your admin account is secured with encryption</span>
          </div>
          <div className="info-box">
            <span className="info-icon">📊</span>
            <span>Access full control over reports and incidents</span>
          </div>
          <div className="info-box">
            <span className="info-icon">✓</span>
            <span>All actions are logged and audited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
