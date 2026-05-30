// src/pages/Auth.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser, logoutUser, loginWithGoogle } from "../services/authService";
import { getUser } from "../services/firestoreService";
import { Shield, Eye, EyeOff, Loader, Users, ShieldCheck, ArrowLeft } from "lucide-react";
import Lottie from "lottie-react";
import toast from "react-hot-toast";
import "./Auth.css";

// Simple animated background data
const animationData = {
  v: "5.7.6",
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: "Security Animation",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle 1",
      sr: 1,
      ks: {
        o: { k: 40 },
        r: { k: 0 },
        p: { k: [100, 100, 0] },
        a: { k: [0, 0, 0] },
        s: { k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { k: [0, 0] },
          s: { k: [80, 80] }
        },
        {
          ty: "st",
          c: { k: [0.96, 0.36, 0.01, 1] },
          o: { k: 100 },
          w: { k: 3 }
        }
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0
    }
  ]
};

export default function Auth({ onClose }) {
  const navigate = useNavigate();
  // Load userType and mode from localStorage to persist across remounts
  const [userType, setUserTypeState] = useState(() => localStorage.getItem("authUserType"));
  const handleClose = () => { if (onClose) onClose(); };
  const [mode, setModeState] = useState(() => localStorage.getItem("authMode") || "login");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [isRegistering, setIsRegistering] = useState(() => localStorage.getItem("isRegistering") === "true");

  // Sync userType to localStorage
  const setUserType = (value) => {
    setUserTypeState(value);
    if (value) localStorage.setItem("authUserType", value);
    else localStorage.removeItem("authUserType");
  };

  // Sync mode to localStorage
  const setMode = (value) => {
    setModeState(value);
    localStorage.setItem("authMode", value);
  };

  // Ensure we're always on login mode while registering
  useEffect(() => {
    if (isRegistering) {
      setModeState("login");
    }
  }, [isRegistering]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (userType === "admin") {
        // For admin, check if the Google user has admin role
        const user = await loginWithGoogle();
        const profile = await getUser(user.uid);
        if (!profile || profile.role !== "admin") {
          // Sign out if not admin
          await logoutUser();
          throw new Error("Access denied. Admin privileges required.");
        }
      } else {
        // For citizen, simply login
        await loginWithGoogle();
      }

      toast.success("Welcome back!");
      // Clear auth storage on successful login
      localStorage.removeItem("authUserType");
      localStorage.removeItem("authMode");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await loginUser(form.email, form.password);

        // For admin login, check if user has admin role
        if (userType === "admin") {
          const profile = await getUser(user.uid);
          if (!profile || profile.role !== "admin") {
            // Sign out the user if not admin
            await logoutUser();
            throw new Error("Access denied. Admin privileges required.");
          }
        }

        toast.success("Welcome back!");
        // Clear auth storage on successful login
        localStorage.removeItem("authUserType");
        localStorage.removeItem("authMode");
        navigate("/");
      } else {
        if (!form.name || !form.phone) throw new Error("All fields required");
        // Set flag to prevent Home page from showing during registration
        localStorage.setItem("isRegistering", "true");
        setIsRegistering(true);
        await registerUser(form.email, form.password, form.name, form.phone);
        // Clear the registration flag after signout completes
        localStorage.removeItem("isRegistering");
        setIsRegistering(false);
        toast.success("Account created! Please login to continue.");
        
        // Switch to login mode after successful registration
        setMode("login");
        setForm({ name: "", email: form.email, password: "", phone: "" });
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // If no user type selected, show selection screen
  if (!userType) {
    return (
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-card card animate-fade-up">
          {/* Close Button */}
          <button className="auth-close-btn" onClick={handleClose}>
            &times;
          </button>

          {/* Logo */}
          <div className="auth-logo">
            <Shield size={28} />
            <span>Securra</span>
          </div>
          <h2 className="auth-title">Welcome to Securra</h2>
          <p className="auth-sub">Choose your account type to continue</p>

          <div className="user-type-selection">
            <button
              className="user-type-btn citizen-btn"
              onClick={() => setUserType("citizen")}
            >
              <div className="btn-icon">
                <Users size={24} />
              </div>
              <div>
                <h3>Citizen</h3>
                <p>Report emergencies, track incidents, get safety alerts</p>
              </div>
            </button>

            <button
              className="user-type-btn admin-btn"
              onClick={() => setUserType("admin")}
            >
              <div className="btn-icon">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3>Administrator</h3>
                <p>Manage reports, dispatch help, oversee operations</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login/register form based on user type
  const isLogin = mode === "login";
  const showRegister = userType === "citizen";

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card card animate-fade-up">
        {/* Close Button */}
        <button className="auth-close-btn" onClick={onClose}>
          &times;
        </button>
        {/* Logo */}
        <div className="auth-logo">
          <Shield size={28} />
          <span>Securra</span>
        </div>

        {/* User Type Badge */}
        <div className={`user-type-badge ${userType}`}>
          {userType === "citizen" ? <Users size={16} /> : <ShieldCheck size={16} />}
          {userType === "citizen" ? "Citizen" : "Administrator"}
        </div>

        <h2 className="auth-title">
          {userType === "admin" ? "Admin Login" : isLogin ? "Citizen Login" : "Citizen Registration"}
        </h2>
        <p className="auth-sub">
          {userType === "admin"
            ? "Access administrative controls"
            : isLogin
              ? "Login to report emergencies and track incidents"
              : "Join India's emergency response community"}
        </p>

        {/* Mode Tabs for Citizen */}
        {showRegister && (
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`auth-tab ${!isLogin ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && showRegister && (
            <div className="field">
              <label>Full Name</label>
              <input
                className="input"
                placeholder="Priya Sharma"
                value={form.name}
                onChange={set("name")}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </div>

          {!isLogin && showRegister && (
            <div className="field">
              <label>Phone Number</label>
              <input
                className="input"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                required
              />
            </div>
          )}

          <div className="field">
            <label>Password</label>
            <div className="pass-wrap">
              <input
                className="input"
                type={showPass ? "text" : "password"}
                placeholder="********"
                value={form.password}
                onChange={set("password")}
                required
                minLength={6}
              />
              <button
                type="button"
                className="pass-toggle"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div id="recaptcha-container" />

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? <Loader size={16} className="spin" /> : null}
            {userType === "admin" ? "Login as Admin" : isLogin ? "Login" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        {isLogin && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>

            {/* Google Login Button */}
            <button
              type="button"
              className="btn btn-google"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader size={16} className="spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </button>
          </>
        )}

        {showRegister && (
          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setMode(isLogin ? "register" : "login")}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        )}
      </div>

      {/* Back to Selection Button - Outside Container */}
      {userType && (
        <button
          className="back-btn-outside"
          onClick={() => setUserType(null)}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to selection</span>
        </button>
      )}
    </div>
  );
}
