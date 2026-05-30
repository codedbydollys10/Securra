// src/pages/Report.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  submitReport,
  checkNearbyReports,
  addNotification,
} from "../services/firestoreService";
import { sendRealPhoneOTP, verifyOTP, clearOTPConfirmation } from "../services/authService";
import CameraCapture from "../components/CameraCapture";

import { MapPin, Camera, Phone, Loader, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import "./Report.css";

const TYPES = [
  { value: "accident", label: "🚗 Road Accident" },
  { value: "fire", label: "🔥 Fire" },
  { value: "cyclone", label: "🌪 Cyclone" },
];

export default function Report() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1=form, 2=otp, 3=success
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedData, setCapturedData] = useState(null); // { image, latitude, longitude, locationName, timestamp, ... }
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [form, setForm] = useState({
    type: "accident",
    description: "",
    phone: profile?.phone || "",
  });

  useEffect(() => {
    // Auto-detect location for form reference only
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast.error("Enable GPS for accurate reporting")
    );
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Handle camera capture callback
  const handleCameraCapture = (data) => {
    setCapturedData(data);
    setCameraOpen(false);
    toast.success("📸 Photo captured with location data!");
  };

  // Clear captured data
  const handleClearPhoto = () => {
    setCapturedData(null);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!user) { toast.error("Please login first"); navigate("/login"); return; }
    if (!form.description.trim()) { toast.error("Please describe the emergency"); return; }
    if (!form.phone.trim()) { toast.error("Please enter your phone number"); return; }
    if (!location && !capturedData) { toast.error("Location not detected. Please capture a photo or enable GPS."); return; }

    // Send real OTP
    setOtpSending(true);
    try {
      await sendRealPhoneOTP(form.phone);
      setStep(2);
      toast.success(`✓ OTP sent to ${form.phone}`);
    } catch (error) {
      toast.error(error.message || "Failed to send OTP");
      console.error("OTP Error:", error);
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { toast.error("Please enter 6-digit OTP"); return; }
    setLoading(true);
    try {
      // Step 1: Verify OTP with Firebase
      console.log("🔐 Verifying OTP...");
      await verifyOTP(otp);
      toast.success("✓ Phone verified!");

      // Step 2: Build report data
      const reportData = {
        userId: user.uid,
        debug_uid: user.uid, // Temporary log to verify UUID in Firestore
        userName: profile?.name || user.displayName || "User",  // Use profile.name first!
        email: user.email || "",  // Include email for user document
        type: form.type,
        description: form.description,
        phone: form.phone,  // This phone will be saved permanently in user doc
        createdAt: new Date(),
      };

      console.log("📤 Building report with userName:", reportData.userName);
      console.log("   Current profile.name:", profile?.name);
      console.log("   Current user.displayName:", user.displayName);

      // Step 3: Add location data
      if (capturedData) {
        reportData.lat = capturedData.latitude;
        reportData.lng = capturedData.longitude;
        reportData.locationName = capturedData.locationName;
        reportData.fullAddress = capturedData.fullAddress;
        reportData.photoURL = capturedData.image;
        reportData.timestamp = capturedData.timestamp;
        reportData.accuracy = capturedData.accuracy;
        reportData.hasGeotaggedPhoto = true;
      } else {
        if (!location) {
          toast.error("❌ Location not detected. Please capture a photo with camera.");
          setLoading(false);
          return;
        }
        reportData.lat = location.lat;
        reportData.lng = location.lng;
        reportData.timestamp = new Date();
        reportData.hasGeotaggedPhoto = false;
      }

      // Step 4: Check nearby reports
      try {
        const nearby = await checkNearbyReports(reportData.lat, reportData.lng, form.type);
        reportData.confidence = 1 + nearby;
      } catch (err) {
        console.warn("⚠️ Could not check nearby reports:", err);
        reportData.confidence = 1;
      }

      // Step 5: Submit report (this will create user doc with phone number)
      console.log("📤 Submitting report...", reportData, "with profile:", profile);
      const reportId = await submitReport(reportData, profile); // Pass the profile object
      console.log("✅ Report submitted:", reportId);
      toast.success("✅ Report submitted successfully!");

      // Step 6: Add notification
      try {
        await addNotification(
          user.uid,
          `✅ Your ${form.type} report was received. Report ID: ${reportId.slice(0, 8)}`,
          "report"
        );
      } catch (err) {
        console.warn("⚠️ Could not add notification:", err);
      }

      // Step 7: Refresh profile to get updated user data (phone, report count)
      try {
        await refreshProfile();
        console.log("✅ Profile refreshed after report submission");
      } catch (err) {
        console.warn("⚠️ Could not refresh profile:", err);
      }

      // Step 8: Clear OTP and move to success
      clearOTPConfirmation();
      setStep(3);
    } catch (e) {
      console.error("❌ Verification error:", e);
      toast.error(`❌ ${e.message || "Verification failed. Please try again."}`);
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <div className="report-container">
        {/* Header */}
        <div className="report-header">
          <h1>Report Emergency</h1>
          <p>Your report helps dispatch help faster. All reports are verified.</p>
        </div>

        {/* Step Indicators */}
        <div className="report-steps">
          {["Report Details", "OTP Verify", "Submitted"].map((s, i) => (
            <div key={s} className={`rstep ${step > i + 1 ? "done" : ""} ${step === i + 1 ? "active" : ""}`}>
              <div className="rstep-num">{step > i + 1 ? "✓" : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <form className="report-form card" onSubmit={handleSubmitForm}>
            {/* Emergency Type */}
            <div className="field">
              <label>Emergency Type</label>
              <div className="type-grid">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`type-btn ${form.type === t.value ? "active" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="field">
              <label>Location</label>
              <div className={`location-box ${location ? "detected" : "detecting"}`}>
                <MapPin size={16} />
                {location
                  ? `📍 ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                  : "Detecting your location..."}
              </div>
            </div>

            {/* Description */}
            <div className="field">
              <label>Describe the Emergency</label>
              <textarea
                className="input"
                rows={4}
                placeholder="Describe what happened, number of people affected, any specific details..."
                value={form.description}
                onChange={set("description")}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Photo from Camera */}
            <div className="field">
              <label>📸 Capture Photo Evidence (Optional but Recommended)</label>
              {capturedData ? (
                <div className="captured-photo-box">
                  <img src={capturedData.image} alt="Captured" className="captured-photo-preview" />
                  <div className="captured-info">
                    <p>✓ 📍 {capturedData.locationName}</p>
                    <p>✓ 📅 {new Date(capturedData.timestamp).toLocaleString()}</p>
                    <p>✓ Accuracy: ±{Math.round(capturedData.accuracy)}m</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-small btn-ghost"
                    onClick={handleClearPhoto}
                  >
                    <X size={16} /> Clear & Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary camera-capture-btn"
                  onClick={() => setCameraOpen(true)}
                >
                  <Camera size={18} />
                  Open Camera & Capture
                </button>
              )}
              <p className="field-hint">Camera captures location + timestamp automatically</p>
            </div>

            {/* Phone */}
            <div className="field">
              <label>Your Phone Number</label>
              <div className="phone-row">
                <Phone size={16} className="phone-icon" />
                <input
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={set("phone")}
                  required
                  style={{ paddingLeft: "2.25rem" }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary report-btn" disabled={otpSending}>
              {otpSending ? <Loader size={16} className="spin" /> : null}
              {otpSending ? "Sending OTP..." : "Send OTP & Continue"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <div className="otp-card card">
            <div className="otp-icon">📱</div>
            <h3>Verify Your Phone</h3>
            <p>Enter the OTP sent to <strong>{form.phone}</strong></p>
            <input
              className="input otp-input"
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button
              className="btn btn-primary report-btn"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
            >
              {loading ? <Loader size={16} className="spin" /> : null}
              {loading ? "Verifying..." : "Verify & Submit Report"}
            </button>
            <button className="btn btn-ghost" onClick={() => { setStep(1); setOtp(""); }}>
              ← Go Back
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="success-card card">
            <CheckCircle size={48} color="var(--success)" />
            <h2>Report Submitted!</h2>
            <p>
              Your emergency report has been received. Admin will verify and
              dispatch help. You'll receive notifications on updates.
            </p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => navigate("/profile")}>
                Track Report
              </button>
              <button className="btn btn-ghost" onClick={() => navigate("/map")}>
                View on Map
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Capture Modal */}
      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
