// src/components/ReportDetailsModal.jsx
// Enhanced report details with geotagged photo verification

import React from "react";
import {
  X,
  MapPin,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Zap,
  Navigation,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import "./ReportDetailsModal.css";

export default function ReportDetailsModal({ report, onClose, onAction }) {
  const {
    id,
    type,
    description,
    userName,
    phone,
    lat,
    lng,
    locationName,
    fullAddress,
    photoURL,
    timestamp,
    accuracy,
    hasGeotaggedPhoto,
    status,
    createdAt,
    confidence,
  } = report;

  const handleVerify = () => onAction(report, "verify");
  const handleFake = () => onAction(report, "fake");
  const handleDispatch = () => onAction(report, "dispatch");

  // Helper function to validate date
  const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  };

  // Calculate time difference between report submission and photo capture
  const reportTime = new Date(createdAt?.toDate?.() || createdAt);
  const photoTime = timestamp ? new Date(timestamp) : null;
  const timeDiff = photoTime && isValidDate(photoTime) ? Math.abs(reportTime - photoTime) / 1000 : null; // seconds

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="title-row">
            <h2>Report Details</h2>
            <span className={`status-badge status-${status}`}>{status}</span>
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Incident Info */}
          <section className="detail-section">
            <h3>Incident Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Type</span>
                <span className="value">{type}</span>
              </div>
              <div className="detail-item">
                <span className="label">Status</span>
                <span className={`value status-${status}`}>{status}</span>
              </div>
              <div className="detail-item">
                <span className="label">Confidence</span>
                <span className="value">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${Math.min(confidence * 25, 100)}%` }}
                    />
                  </div>
                  {confidence.toFixed(1)}
                </span>
              </div>
              <div className="detail-item full-width">
                <span className="label">Description</span>
                <span className="value multiline">{description}</span>
              </div>
            </div>
          </section>

          {/* User Info */}
          <section className="detail-section">
            <h3>Reporter Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Name</span>
                <span className="value">{userName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone</span>
                <span className="value">
                  <a href={`tel:${phone}`}>{phone}</a>
                </span>
              </div>
            </div>
          </section>

          {/* Location Info */}
          <section className="detail-section">
            <h3>Location Data</h3>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <span className="label">
                  <MapPin size={16} /> Location Name
                </span>
                <span className="value">{locationName || "Not available"}</span>
              </div>
              {fullAddress && (
                <div className="detail-item full-width">
                  <span className="label">Full Address</span>
                  <span className="value">{fullAddress}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="label">Latitude</span>
                <span className="value monospace">{lat.toFixed(6)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Longitude</span>
                <span className="value monospace">{lng.toFixed(6)}</span>
              </div>
              {accuracy && (
                <div className="detail-item">
                  <span className="label">Accuracy</span>
                  <span className="value">±{Math.round(accuracy)}m</span>
                </div>
              )}
            </div>

            {/* Google Maps Link */}
            <a
              href={`https://maps.google.com/?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="maps-link"
            >
              <Navigation size={16} /> Open in Google Maps
            </a>
          </section>

          {/* Photo Section */}
          {photoURL && (
            <section className="detail-section">
              <h3>
                <Eye size={16} /> Captured Photo
                {hasGeotaggedPhoto && <span className="badge badge-success">Geotagged</span>}
              </h3>
              <div className="photo-preview-section">
                <img src={photoURL} alt="Report photo" className="photo-full" />
                <p className="photo-note">
                  📸 Photo includes overlaid timestamp and location data
                </p>
              </div>
            </section>
          )}

          {/* Timestamp Info */}
          <section className="detail-section">
            <h3>
              <Clock size={16} /> Timestamp Information
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Report Submitted</span>
                <span className="value">
                  {isValidDate(reportTime) ? reportTime.toLocaleString() : "Invalid date"}
                  {isValidDate(reportTime) && (
                    <>
                      <br />
                      <span className="muted">({formatDistanceToNow(reportTime)} ago)</span>
                    </>
                  )}
                </span>
              </div>
              {photoTime && isValidDate(photoTime) && (
                <>
                  <div className="detail-item">
                    <span className="label">Photo Captured</span>
                    <span className="value">
                      {photoTime.toLocaleString()}
                      <br />
                      <span className="muted">
                        ({formatDistanceToNow(photoTime)} ago)
                      </span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Time Difference</span>
                    <span className={`value ${timeDiff > 300 ? "warning" : ""}`}>
                      {timeDiff} seconds
                      {timeDiff > 300 && (
                        <AlertCircle size={14} className="alert-icon" />
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Verification Checklist */}
          <section className="detail-section verification-checklist">
            <h3>
              <Shield size={16} /> Verification Checklist
            </h3>
            <div className="checklist">
              <div className={`check-item ${photoURL ? "passed" : "failed"}`}>
                <span className="icon">
                  {photoURL ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </span>
                <span>Photo provided</span>
              </div>
              <div className={`check-item ${accuracy && accuracy < 1000 ? "passed" : "failed"}`}>
                <span className="icon">
                  {accuracy && accuracy < 1000 ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                </span>
                <span>High GPS accuracy (&lt; 1km)</span>
              </div>
              <div className={`check-item ${timeDiff && timeDiff < 60 ? "passed" : "failed"}`}>
                <span className="icon">
                  {timeDiff && timeDiff < 60 ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                </span>
                <span>Recent capture (&lt; 1 min from submission)</span>
              </div>
              <div className={`check-item ${hasGeotaggedPhoto ? "passed" : "failed"}`}>
                <span className="icon">
                  {hasGeotaggedPhoto ? <CheckCircle size={18} /> : <XCircle size={18} />}
                </span>
                <span>Location metadata captured</span>
              </div>
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          {status !== "verified" && (
            <button className="btn btn-success" onClick={handleVerify}>
              <CheckCircle size={16} /> Verify Report
            </button>
          )}
          {status !== "fake" && (
            <button className="btn btn-danger" onClick={handleFake}>
              <XCircle size={16} /> Mark as Fake
            </button>
          )}
          {status === "verified" && (
            <button className="btn btn-primary" onClick={handleDispatch}>
              <Zap size={16} /> Dispatch Emergency
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
