// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";
import AdminNavbar from "../components/AdminNavbar";
import ReportDetailsModal from "../components/ReportDetailsModal";
import {
  listenToReports,
  listenToSOS,
  listenToUsers,
  verifyReport,
  markReportFake,
  dispatchEmergency,
  respondToSOS,
  updateTrustScore,
  addNotification,
  upsertUser,
  trackDispatchedReport,
  recalculateTrustScore,
  updateUserFakeReports,
} from "../services/firestoreService";
import { useNavigate } from "react-router-dom";
import {
  Shield, AlertTriangle, Users, CheckCircle,
  XCircle, Truck, Clock, MapPin, Eye, X, Send, ArrowLeft, Menu,
  TrendingUp, Activity, Zap, Target, User, Settings, Mail, Phone, LogOut, Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("reports");
  const [filter, setFilter] = useState("pending");
  const [processing, setProcessing] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFake, setEditFake] = useState(0);

  // Check if user is admin
  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "admin") {
      navigate("/");
      toast.error("Admin access required");
    }

    const u1 = listenToReports(setReports);
    const u2 = listenToSOS((sosData) => {
      console.log("🆘 SOS data updated in admin:", sosData);
      setSosList(sosData);
    });
    const u3 = listenToUsers(setUsers);
    return () => { u1(); u2(); u3(); };
  }, [profile, navigate]);

  const handleAction = async (report, action) => {
    setProcessing(report.id);
    try {
      if (action === "verify") {
        await verifyReport(report.id, user.uid, "");
        // Auto-dispatch verified reports
        await dispatchEmergency(report.id, user.uid, "");
        await updateTrustScore(report.userId, true);
        await addNotification(
          report.userId,
          `✅ Your report is verified. Help is on the way!`,
          "verified"
        );
      } else if (action === "fake") {
        await markReportFake(report.id, user.uid, "");
        await recalculateTrustScore(report.userId);
        await addNotification(
          report.userId,
          `❌ Your report was not verified. Please contact admin for details.`,
          "fake"
        );
      } else if (action === "dispatch") {
        await dispatchEmergency(report.id, user.uid, "");
        await addNotification(
          report.userId,
          `🚑 Emergency services have been dispatched to your location (${report.lat}, ${report.lng}). Stay safe!`,
          "dispatched"
        );
      }

      toast.success(`Report ${action}ed successfully!`);
    } catch (e) {
      toast.error("Action failed: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const makeMeAdmin = async () => {
    if (!user) return;
    try {
      await upsertUser(user.uid, { role: "admin" });
      toast.success("You are now an admin!");
      window.location.reload();
    } catch (e) {
      toast.error("Failed: " + e.message);
    }
  };

  const filteredReports = 
    filter === "all" ? reports : 
    filter === "verified" ? reports.filter(r => r.verifiedAt) : // Show all verified reports (including dispatched)
    reports.filter(r => r.status === filter);
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    verified: reports.filter(r => r.verifiedAt).length, // Count reports that have been verified (including dispatched ones)
    dispatched: reports.filter(r => r.status === "dispatched").length,
    fake: reports.filter(r => r.status === "fake").length,
    sos: sosList.length,
  };

  // Calculate report types distribution
  const reportsByType = {
    accident: reports.filter(r => r.type === "accident").length,
    fire: reports.filter(r => r.type === "fire").length,
    disaster: reports.filter(r => r.type === "disaster").length,
  };

  // Calculate verification rate
  const verificationRate = stats.total > 0
    ? Math.round((stats.verified / stats.total) * 100)
    : 0;

  // Get activeusers count
  const activeUsers = users.filter(u => u.totalReports > 0).length;

  // Calculate average trust score
  const avgTrustScore = users.length > 0
    ? Math.round(users.reduce((sum, u) => sum + (u.trustScore || 0), 0) / users.length)
    : 0;

  // Responsive time data (last 7 days simulation)
  const reportsData = Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    count: Math.floor(Math.random() * (stats.total / 7) * 2) + 1,
  }));

  if (!profile || profile.role !== "admin") {
    return (
      <div className="admin-page admin-restricted">
        <div className="admin-restrict-box">
          <Shield size={48} color="var(--orange)" />
          <h2>Admin Access Required</h2>
          <p>You don't have admin permissions</p>
          {profile?.role !== "admin" && user && (
            <button className="btn btn-primary" onClick={makeMeAdmin}>
              Request Admin Access (Testing)
            </button>
          )}
          {!user && (
            <button className="btn btn-primary" onClick={() => navigate("/login")}>
              Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminNavbar />
      <main className="admin-main">
        <div className="admin-inner">
          {/* Header */}
          <div className="admin-header-main">
            <div>
              <h1>Admin Dashboard</h1>
              <p className="admin-sub">Real-time emergency response monitoring & analytics</p>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="metrics-grid">
            <div className="metric-card metric-primary">
              <div className="metric-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{stats.total}</div>
                <div className="metric-label">Total Reports</div>
              </div>
              <div className="metric-trend">↑ Trend</div>
            </div>

            <div className="metric-card metric-warning">
              <div className="metric-icon">
                <Clock size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{stats.pending}</div>
                <div className="metric-label">Pending</div>
              </div>
              <div className="metric-trend">⏳ Action needed</div>
            </div>

            <div className="metric-card metric-success">
              <div className="metric-icon">
                <CheckCircle size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{verificationRate}%</div>
                <div className="metric-label">Verified Rate</div>
              </div>
              <div className="metric-trend">✓ {stats.verified} verified</div>
            </div>

            <div className="metric-card metric-danger">
              <div className="metric-icon">
                <Zap size={24} />
              </div>
              <div className="metric-content">
                <div className="metric-value">{stats.sos}</div>
                <div className="metric-label">Active SOS</div>
              </div>
              <div className="metric-trend">🆘 Emergency</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            {/* Status Distribution Pie Chart */}
            <div className="chart-card">
              <h3 className="chart-title">Report Status Distribution</h3>
              <div className="donut-chart-container">
                <svg viewBox="0 0 200 200" className="donut-chart">
                  {/* Create pie slices */}
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#ff6b6b" strokeWidth="18"
                    strokeDasharray={`${(stats.pending / stats.total) * 502.7} 502.7`}
                    strokeDashoffset="0" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#6bcf7f" strokeWidth="18"
                    strokeDasharray={`${(stats.verified / stats.total) * 502.7} 502.7`}
                    strokeDashoffset={`${-(stats.pending / stats.total) * 502.7}`} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#3b82f6" strokeWidth="18"
                    strokeDasharray={`${(stats.dispatched / stats.total) * 502.7} 502.7`}
                    strokeDashoffset={`${-((stats.pending + stats.verified) / stats.total) * 502.7}`} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="80" fill="transparent" stroke="#ea5455" strokeWidth="18"
                    strokeDasharray={`${(stats.fake / stats.total) * 502.7} 502.7`}
                    strokeDashoffset={`${-((stats.pending + stats.verified + stats.dispatched) / stats.total) * 502.7}`} strokeLinecap="round" />
                  <circle cx="100" cy="100" r="50" fill="var(--bg)" />
                  <text x="100" y="95" textAnchor="middle" className="donut-text" fontSize="14" fontWeight="bold">
                    {stats.total}
                  </text>
                  <text x="100" y="110" textAnchor="middle" className="donut-subtext" fontSize="12">
                    Total
                  </text>
                </svg>
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: "#ff6b6b" }}></span>
                    <span>Pending ({stats.pending})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: "#6bcf7f" }}></span>
                    <span>Verified ({stats.verified})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: "#3b82f6" }}></span>
                    <span>Dispatched ({stats.dispatched})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: "#ea5455" }}></span>
                    <span>Fake ({stats.fake})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Type Breakdown */}
            <div className="chart-card">
              <h3 className="chart-title">Reports by Type</h3>
              <div className="bar-chart">
                {Object.entries(reportsByType).map(([type, count]) => (
                  <div key={type} className="bar-item">
                    <div className="bar-label">
                      {type === "accident" ? "🚗" : type === "fire" ? "🔥" : "🌪"} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                    <div className="bar-container">
                      <div className="bar-fill" style={{
                        width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`,
                        backgroundColor: type === "accident" ? "#ff6b6b" : type === "fire" ? "#ffa500" : "#2e7d32",
                      }}>
                      </div>
                    </div>
                    <div className="bar-value">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="admin-stats">
            <div className="astat" style={{ borderTopColor: "#ff6b6b" }}>
              <div className="astat-val">{stats.pending}</div>
              <div className="astat-label">Pending</div>
              <div className="astat-mini">Action required</div>
            </div>
            <div className="astat" style={{ borderTopColor: "#6bcf7f" }}>
              <div className="astat-val">{stats.verified}</div>
              <div className="astat-label">Verified</div>
              <div className="astat-mini">Confirmed</div>
            </div>
            <div className="astat" style={{ borderTopColor: "var(--orange)" }}>
              <div className="astat-val">{stats.dispatched}</div>
              <div className="astat-label">Dispatched</div>
              <div className="astat-mini">Help sent</div>
            </div>
            <div className="astat" style={{ borderTopColor: "#ea5455" }}>
              <div className="astat-val">{stats.fake}</div>
              <div className="astat-label">Fake</div>
              <div className="astat-mini">False reports</div>
            </div>
            <div className="astat" style={{ borderTopColor: "#1565c0" }}>
              <div className="astat-val">{activeUsers}</div>
              <div className="astat-label">Active Users</div>
              <div className="astat-mini">Made reports</div>
            </div>
            <div className="astat" style={{ borderTopColor: "#9c27b0" }}>
              <div className="astat-val">{avgTrustScore}</div>
              <div className="astat-label">Avg Trust</div>
              <div className="astat-mini">Score</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            {["reports", "sos", "users", "profile"].map(t => (
              <button
                key={t}
                className={`admin-tab ${tab === t ? "active" : ""}`}
                onClick={() => { setTab(t); setFilter(t === "reports" ? "pending" : "all"); }}
              >
                {t === "reports" ? "📋 Reports" : t === "sos" ? "🆘 SOS Alerts" : t === "users" ? "👥 Users" : "👤 Profile"}
              </button>
            ))}
          </div>

          {/* Filters */}
          {tab === "reports" && (
            <div className="status-filters">
              {["pending", "verified", "fake", "dispatched", "all"].map(s => (
                <button
                  key={s}
                  className={`filter-btn ${filter === s ? "active" : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Reports List */}
          {tab === "reports" && (
            <div className="admin-list">
              {filteredReports.length === 0 ? (
                <div className="empty-state">No reports in this category</div>
              ) : (
                filteredReports.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-type-badge" style={{
                        backgroundColor:
                          report.type === "accident" ? "#ff6b6b" :
                            report.type === "fire" ? "#ffa500" :
                              "#2e7d32"
                      }}>
                        {report.type === "accident" ? "🚗" : report.type === "fire" ? "🔥" : "🌪"}
                        {" " + report.type.toUpperCase()}
                      </div>
                      <div className="report-status" style={{
                        color:
                          report.status === "pending" ? "#ff6b6b" :
                            report.status === "verified" ? "#6bcf7f" :
                              report.status === "fake" ? "#ff6b6b" :
                                "var(--orange)"
                      }}>
                        {report.status.toUpperCase()}
                      </div>
                    </div>

                    <div className="report-body">
                      <h4>{report.userName}</h4>
                      <p className="report-desc">{report.description}</p>
                      <div className="report-meta">
                        <div><MapPin size={14} /> {report.lat?.toFixed(4)}, {report.lng?.toFixed(4)}</div>
                        <div><Clock size={14} /> {formatDistanceToNow(new Date(report.createdAt.seconds * 1000), { addSuffix: true })}</div>
                        {report.confidence && <div>📊 Confidence: {report.confidence}</div>}
                      </div>
                      {report.photoURL && (
                        <button
                          className="btn-view-photo"
                          onClick={() => setSelectedReport(report)}
                        >
                          <Eye size={16} /> View Details
                        </button>
                      )}
                    </div>

                    {report.status === "pending" && (
                      <div className="report-actions">
                        <button
                          className="btn btn-success"
                          onClick={() => handleAction(report, "verify")}
                          disabled={processing === report.id}
                        >
                          <CheckCircle size={14} /> Verify
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleAction(report, "fake")}
                          disabled={processing === report.id}
                        >
                          <XCircle size={14} /> Fake
                        </button>
                      </div>
                    )}

                    {report.status === "verified" && (
                      <div className="report-actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAction(report, "dispatch")}
                          disabled={processing === report.id}
                        >
                          <Truck size={14} /> Dispatch Emergency Services
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* SOS Alerts */}
          {tab === "sos" && (
            <div className="admin-list">
              {sosList.length === 0 ? (
                <div className="empty-state">No active SOS alerts</div>
              ) : (
                sosList.map(sos => (
                  <div key={sos.id} className="sos-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h4>🆘 {sos.userName}</h4>
                      <span className="sos-badge">ACTIVE</span>
                    </div>
                    <div className="report-meta">
                      <div><MapPin size={14} /> {sos.lat}, {sos.lng}</div>
                      <div>📞 {sos.phone}</div>
                      <div><Clock size={14} /> {formatDistanceToNow(new Date(sos.createdAt.seconds * 1000), { addSuffix: true })}</div>
                    </div>
                    <button className="btn btn-primary" onClick={() => window.open(`https://maps.google.com/?q=${sos.lat},${sos.lng}`)}>
                      📍 View on Map
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Users */}
          {tab === "users" && (
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Trust Score</th>
                    <th>Reports</th>
                    <th>Verified</th>
                    <th>Fake</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name || "N/A"}</td>
                      <td>{u.email || "N/A"}</td>
                      <td><span className="role-badge" style={{ backgroundColor: u.role === "admin" ? "var(--orange)" : "#6bcf7f" }}>{u.role}</span></td>
                      <td style={{ color: u.trustScore >= 80 ? "#6bcf7f" : u.trustScore >= 50 ? "#ffa500" : "#ff6b6b", fontWeight: 600 }}>{u.trustScore || 0}</td>
                      <td>{u.totalReports || 0}</td>
                      <td style={{ color: "#6bcf7f", fontWeight: 600 }}>{u.verifiedReports || 0}</td>
                      <td style={{ color: "#ef4444", fontWeight: 600 }}>{u.fakeReports || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Admin Profile Tab */}
          {tab === "profile" && (
            <div className="profile-section">
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
                  <button className="action-btn btn-primary" onClick={async () => {
                    await logoutUser();
                    toast.success("Logged out successfully");
                    window.location.href = "/";
                  }}>
                    <LogOut size={16} /> Logout
                  </button>
                  <button
                    className="action-btn btn-primary"
                    disabled={isSyncing}
                    onClick={async () => {
                      const confirmSync = window.confirm("This will recount all reports for all users to fix trust scores. Continue?");
                      if (!confirmSync) return;

                      setIsSyncing(true);
                      try {
                        // Recalculate trust scores for all users
                        for (const user of users) {
                          await recalculateTrustScore(user.id);
                        }
                        toast.success("Trust scores & report counts synced successfully!");
                      } catch (e) {
                        console.error("Sync Error:", e);
                        toast.error("Sync failed: " + e.message);
                      } finally {
                        setIsSyncing(false);
                      }
                    }}
                  >
                    {isSyncing ? "⌛ Syncing..." : "🔄 Sync Trust Scores"}
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
                  <span className="pstat-val">{users.length}</span>
                  <span className="pstat-label">Total Users</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "var(--orange)" }}>
                    <AlertTriangle size={18} />
                  </div>
                  <span className="pstat-val">{reports.length}</span>
                  <span className="pstat-label">Total Reports</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "#22c55e" }}>
                    <CheckCircle size={18} />
                  </div>
                  <span className="pstat-val">{reports.filter((r) => r.status === "verified").length}</span>
                  <span className="pstat-label">Verified</span>
                </div>
                <div className="pstat card">
                  <div className="pstat-icon" style={{ color: "#ef4444" }}>
                    <XCircle size={18} />
                  </div>
                  <span className="pstat-val">{reports.filter((r) => r.status === "fake").length}</span>
                  <span className="pstat-label">Rejected</span>
                </div>
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
                      <button
                        className="btn btn-danger"
                        onClick={async () => {
                          try {
                            toast.error("Admin account deletion requires special permissions");
                            setShowDeleteConfirm(false);
                          } catch (err) {
                            toast.error("Failed to perform action");
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Report Details Modal */}
        {selectedReport && (
          <ReportDetailsModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onAction={handleAction}
          />
        )}

      </main>
    </div>
  );
}
