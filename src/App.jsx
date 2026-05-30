// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Auth from "./pages/Auth";

// Pages
import Home from "./pages/Home";
import Report from "./pages/Report";
import MapPage from "./pages/MapPage";
import Alerts from "./pages/Alerts";
import SafetyInfo from "./pages/SafetyInfo";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AssistantPage from "./pages/AssistantPage";
import RoleSelection from "./pages/RoleSelection";
import AdminLogin from "./pages/AdminLogin";

// Protected Route
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const isRegistering = localStorage.getItem("isRegistering") === "true";
  const isAdminRoute = location.pathname === "/admin";
  const isRoleSelectionRoute = location.pathname === "/role-select" || location.pathname === "/admin-login";

  if (loading) return <div className="loading-screen">Loading Securra...</div>;

  // Determine user role - admin or citizen
  const isAdmin = user && profile && profile.role === "admin";

  return (
    <>
      {/* Show navbar only when authenticated, not registering, not on admin page, and not on role selection pages, and not admin user */}
      {user && !isRegistering && !isAdminRoute && !isRoleSelectionRoute && !isAdmin && <Navbar />}

      <Routes>
        {/* Admin bypass - if admin tries to access citizen routes, redirect to admin dashboard */}
        {isAdmin ? (
          <>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<Navigate to="/admin" replace />} />
            <Route path="/role-select" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={!isRegistering && user ? <Home /> : <Auth />} />
            <Route path="/role-select" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/info" element={<ProtectedRoute><SafetyInfo /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><AssistantPage /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><Report /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--navy-card)",
                color: "var(--text)",
                border: "1px solid var(--navy-border)",
                borderRadius: "8px",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "var(--navy-card)" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "var(--navy-card)" } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
