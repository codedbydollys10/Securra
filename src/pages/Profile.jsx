// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import {
  listenToUserReports,
  listenToReports,
  listenToSOS,
  listenToUsers,
} from "../services/firestoreService";
import {
  User,
  Star,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  Truck,
  LogOut,
  Settings,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Mail,
  Phone,
  MapPin,
  Clock,
  Zap,
  Loader,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import "./Profile.css";

export default function Profile() {
  const { user, profile, refreshProfile, loading } = useAuth();
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adminStats, setAdminStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    fake: 0,
    dispatched: 0,
    sos: 0,
    users: 0,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    publicProfile: true,
    twoFactorAuth: false,
  });

  // Refresh profile data on component mount and when user changes
  useEffect(() => {
    if (user && !loading) {
      refreshProfile();
    }
  }, [user, loading, refreshProfile]);

  useEffect(() => {
    if (!user || loading || !profile) return;

    if (profile.role === "admin") {
      const u1 = listenToReports(setReports);
      const u2 = listenToSOS((sosList) => {
        setAdminStats((prev) => ({ ...prev, sos: sosList.length }));
      });
      const u3 = listenToUsers((usersList) => {
        setAdminStats((prev) => ({ ...prev, users: usersList.length }));
      });

      return () => {
        u1();
        u2();
        u3();
      };
    } else {
      // Regular user - fetch only their reports
      const unsub = listenToUserReports(user.uid, setReports);
      return unsub;
    }
  }, [user, profile?.role, loading]);

  // Separate effect to update admin stats when reports change
  useEffect(() => {
    if (profile?.role === "admin" && reports.length > 0) {
      setAdminStats((prev) => ({
        ...prev,
        total: reports.length,
        pending: reports.filter((r) => r.status === "pending").length,
        verified: reports.filter((r) => r.status === "verified").length,
        dispatched: reports.filter((r) => r.status === "dispatched").length,
        fake: reports.filter((r) => r.status === "fake").length,
      }));
    }
  }, [reports, profile?.role]);

  // Show loading state
  if (loading || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-page-header">
          <h1>Loading Profile...</h1>
        </div>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <Loader size={48} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  // ADMIN PROFILE
  if (profile.role === "admin") {
    const handleLogout = async () => {
      await logoutUser();
      toast.success("Logged out successfully");
      window.location.href = "/";
    };

    const handleDeleteAccount = async () => {
      try {
        toast.error("Admin account deletion requires special permissions");
        setShowDeleteConfirm(false);
      } catch (err) {
        toast.error("Failed to perform action");
      }
    };

    return (
      <div className="profile-page">
        <div className="profile-page-header">
          <h1>Admin Profile</h1>
          <p>Manage administrator account and system settings</p>
        </div>

        <div className="profile-inner">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <User size={18} /> Overview
            </button>
            <button
              className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={18} /> Settings
            </button>
            <button
              className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <Shield size={18} /> Security
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              <div className="profile-card card admin-card">
                <div className="profile-header-section">
                  <div className="profile-avatar-large admin-avatar">
                    <Shield size={48} />
                  </div>
                  <div className="profile-info-main">
                    <h2>{profile?.name || user?.displayName || "Administrator"}</h2>
                    <p className="email-text">
                      <Mail size={14} /> {profile?.email || user?.email || "No email"}
                    </p>
                    {profile?.phone && (
                      <p className="phone-text">
                        <Phone size={14} /> {profile.phone}
                      </p>
                    )}
                    <div className="admin-status-badge">
                      <Shield size={14} /> ADMINISTRATOR
                    </div>
                  </div>
                  <div className="admin-active-indicator">
                    <span className="status-dot"></span>
                    Active
                  </div>
                </div>

                <div className="profile-quick-actions">
                  <button className="action-btn btn-primary" onClick={handleLogout}>
                    <LogOut size={16} /> Logout
                  </button>
                  <button
                    className="action-btn btn-danger"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </div>

              <div className="profile-stats">
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "#1565c0" }}>
                    <Users size={18} />
                  </div>
                  <span className="pstat-val">{adminStats.users}</span>
                  <span className="pstat-label">Total Users</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "var(--orange)" }}>
                    <FileText size={18} />
                  </div>
                  <span className="pstat-val">{adminStats.total}</span>
                  <span className="pstat-label">Total Reports</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "#22c55e" }}>
                    <CheckCircle size={18} />
                  </div>
                  <span className="pstat-val">{adminStats.verified}</span>
                  <span className="pstat-label">Verified</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "#ef4444" }}>
                    <XCircle size={18} />
                  </div>
                  <span className="pstat-val">{adminStats.fake}</span>
                  <span className="pstat-label">Fake Reports</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "var(--orange)" }}>
                    <Truck size={18} />
                  </div>
                  <span className="pstat-val">{adminStats.dispatched}</span>
                  <span className="pstat-label">Dispatched</span>
                </div>
              </div>
            </>
          )}
        </div>

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Account</h3>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // REGULAR USER PROFILE
  const trust = profile?.trustScore ?? 100;
  const trustLabel = trust >= 80 ? "High" : trust >= 50 ? "Medium" : "Low";
  const trustColor = trust >= 80 ? "#6bcf7f" : trust >= 50 ? "#ffa500" : "#ff6b6b";

  const handleLogout = async () => {
    await logoutUser();
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    try {
      toast.error("Account deletion requires admin support");
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1>My Profile</h1>
        <p>Manage your account, settings, and emergency reports</p>
      </div>

      <div className="profile-inner">
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <User size={18} /> Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings size={18} /> Settings
          </button>
          <button
            className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <Lock size={18} /> Security
          </button>
          <button
            className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <FileText size={18} /> My Reports
          </button>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="profile-card card">
              <div className="profile-header-section">
                <div className="profile-avatar-large">
                  <User size={48} />
                </div>
                <div className="profile-info-main">
                  <h2>{profile?.name || user?.displayName || "User"}</h2>
                  <p className="email-text">
                    <Mail size={14} /> {profile?.email || user?.email || "No email"}
                  </p>
                  {profile?.phone && (
                    <p className="phone-text">
                      <Phone size={14} /> {profile.phone}
                    </p>
                  )}
                </div>
                <div className="trust-block-large">
                  <div className="trust-circle" style={{ borderColor: trustColor }}>
                    <span className="trust-score-large">{trust}</span>
                  </div>
                  <div className="trust-info-text">
                    <p className="trust-title">Trust Score</p>
                    <span
                      className="trust-badge"
                      style={{
                        backgroundColor: `${trustColor}20`,
                        borderColor: trustColor,
                        color: trustColor,
                      }}
                    >
                      {trustLabel} Reporter
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-quick-actions">
                <button className="action-btn btn-primary" onClick={handleLogout}>
                  <LogOut size={16} /> Logout
                </button>
                <button
                  className="action-btn btn-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} /> Delete Account
                </button>
              </div>
            </div>

            <div className="profile-stats">
              <div className="pstat card">
                <div className="pstat-icon" style={{ color: "var(--orange)" }}>
                  <FileText size={18} />
                </div>
                <span className="pstat-val">{profile?.totalReports || 0}</span>
                <span className="pstat-label">Total Reports</span>
              </div>
              <div className="pstat card">
                <div className="pstat-icon" style={{ color: "#6bcf7f" }}>
                  <CheckCircle size={18} />
                </div>
                <span className="pstat-val">{profile?.verifiedReports || 0}</span>
                <span className="pstat-label">Verified</span>
              </div>
              <div className="pstat card">
                <div className="pstat-icon" style={{ color: "#ff6b6b" }}>
                  <XCircle size={18} />
                </div>
                <span className="pstat-val">{profile?.fakeReports || 0}</span>
                <span className="pstat-label">Rejected</span>
              </div>
              <div className="pstat card">
                <div className="pstat-icon" style={{ color: "var(--orange)" }}>
                  <Truck size={18} />
                </div>
                <span className="pstat-val">{profile?.dispatchedReports || 0}</span>
                <span className="pstat-label">Dispatched</span>
              </div>
            </div>

            <div className="trust-info-section card">
              <h3>How Trust Score Works</h3>
              <div className="trust-items">
                <div className="trust-item negative">
                  <XCircle size={16} /> <span>-5 pts – Report marked as fake</span>
                </div>
                <div className="trust-item positive">
                  <CheckCircle size={16} /> <span>100 pts – Maximum starting score</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "settings" && (
          <div className="settings-section card">
            <h3>Notification Settings</h3>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <label>Email Notifications</label>
                  <p>Receive updates about your reports</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, emailNotifications: e.target.checked })
                  }
                />
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <label>SMS Alerts</label>
                  <p>Get emergency updates via text</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.smsAlerts}
                  onChange={(e) => setSettings({ ...settings, smsAlerts: e.target.checked })}
                />
              </div>
              <div className="setting-item">
                <div className="setting-info">
                  <label>Public Profile</label>
                  <p>Allow others to see your profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.publicProfile}
                  onChange={(e) =>
                    setSettings({ ...settings, publicProfile: e.target.checked })
                  }
                />
              </div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
              Save Settings
            </button>
          </div>
        )}

        {activeTab === "security" && (
          <div className="security-section card">
            <h3>Account Security</h3>
            <div className="security-items">
              <div className="security-item">
                <div className="security-info">
                  <h4>Change Password</h4>
                  <p>Update your login password</p>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Update
                </button>
              </div>
              <div className="security-item">
                <div className="security-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={(e) =>
                    setSettings({ ...settings, twoFactorAuth: e.target.checked })
                  }
                />
              </div>
              <div className="security-item">
                <div className="security-info">
                  <h4>Active Sessions</h4>
                  <p>Manage your login sessions</p>
                </div>
                <button className="btn btn-outline">View Sessions</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="reports-section">
            <div className="reports-header card">
              <div>
                <h3>My Emergency Reports</h3>
                <p>View all your submitted emergency reports and their status</p>
              </div>
              <div className="reports-count" style={{ color: "#f75c03", fontSize: "24px", fontWeight: "bold" }}>
                {reports.length}
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="no-reports card">
                <FileText size={48} style={{ color: "#999", marginBottom: "1rem" }} />
                <h4>No reports yet</h4>
                <p>You haven't submitted any emergency reports yet.</p>
              </div>
            ) : (
              <div className="reports-list">
                {reports.map((report) => {
                  const statusColors = {
                    pending: "#f59e0b",
                    reviewing: "#3b82f6",
                    verified: "#22c55e",
                    dispatched: "#0a3d8f",
                    fake: "#ef4444",
                  };
                  const statusColor = statusColors[report.status] || "#666";
                  const reportTime = report.createdAt?.toDate?.() || new Date(report.createdAt);
                  const timeAgo = formatDistanceToNow(new Date(reportTime), { addSuffix: true });
                  const typeEmojis = { accident: "🚗", fire: "🔥", cyclone: "🌪", sos: "🆘" };
                  const typeEmoji = typeEmojis[report.type] || "📍";

                  return (
                    <div key={report.id} className="report-item card">
                      <div className="report-item-header">
                        <div className="report-type-badge">
                          <span>{typeEmoji}</span>
                          <span className="type-text">{report.type}</span>
                        </div>
                        <span className="report-status-badge" style={{ backgroundColor: `${statusColor}20`, color: statusColor, borderColor: statusColor }}>
                          ● {report.status}
                        </span>
                      </div>

                      <div className="report-item-body">
                        <p className="report-description">{report.description}</p>

                        <div className="report-meta">
                          <div className="meta-item">
                            <Clock size={14} />
                            <span>{timeAgo}</span>
                          </div>
                          <div className="meta-item">
                            <MapPin size={14} />
                            <span>{report.locationName || "Location info"}</span>
                          </div>
                          {report.status === "verified" && (
                            <div className="meta-item" style={{ color: "#22c55e" }}>
                              <CheckCircle size={14} />
                              <span>Help is on the way!</span>
                            </div>
                          )}
                          {report.status === "fake" && (
                            <div className="meta-item" style={{ color: "#ef4444" }}>
                              <AlertTriangle size={14} />
                              <span>Marked as false report</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="report-item-footer">
                        <span className="report-id">ID: {report.id.slice(0, 8)}</span>
                        {report.confidence && (
                          <div className="confidence-info">
                            <Zap size={12} />
                            <span>Confidence: {report.confidence.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Delete Account</h3>
              <p>Are you sure you want to delete your account? This action cannot be undone.</p>
              <div className="modal-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
