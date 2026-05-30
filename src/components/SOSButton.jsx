// src/components/SOSButton.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sendSOS } from "../services/firestoreService";
import { addNotification } from "../services/firestoreService";
import { AlertTriangle, Loader } from "lucide-react";
import toast from "react-hot-toast";
import "./SOSButton.css";

export default function SOSButton() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSOS = async () => {
    console.log("🔴 SOS Button clicked");
    console.log("👤 User:", user);
    console.log("👤 Profile:", profile);
    
    if (!user) {
      console.error("❌ No user object - not authenticated!");
      toast.error("Please login to send SOS");
      return;
    }
    if (sent) {
      console.warn("⚠️ Already sent, ignoring duplicate click");
      return;
    }

    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            console.log("📍 Got location:", { latitude, longitude });
            console.log("📊 SOS Data to send:", {
              userId: user.uid,
              userName: profile?.name || user.displayName || "Unknown",
              phone: profile?.phone || "Unknown",
              lat: latitude,
              lng: longitude,
            });
            
            const result = await sendSOS(
              user.uid,
              latitude,
              longitude,
              profile?.name || user.displayName || "Unknown",
              profile?.phone || "Unknown"
            );
            console.log("✅ SOS sent successfully, doc ID:", result.id);
            
            await addNotification(user.uid, "🆘 SOS Alert sent! Help is on the way.", "sos");
            setSent(true);
            toast.success("🆘 SOS Sent! Help is on the way.", { duration: 5000 });
            setTimeout(() => setSent(false), 30000);
          } catch (e) {
            console.error("❌ SOS Error:", e);
            console.error("Error code:", e.code);
            console.error("Error message:", e.message);
            toast.error("SOS failed: " + e.message);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error("❌ Geolocation error:", err.code, err.message);
          setLoading(false);
          toast.error("Location access denied. Please enable GPS.");
        }
      );
    } catch (e) {
      console.error("❌ Outer SOS error:", e);
      toast.error("SOS failed: " + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="sos-wrapper">
      <button
        className={`sos-btn ${sent ? "sent" : ""} ${loading ? "loading" : ""}`}
        onClick={handleSOS}
        disabled={loading}
      >
        <span className="sos-ring ring1" />
        <span className="sos-ring ring2" />
        <span className="sos-ring ring3" />
        <span className="sos-inner">
          {loading ? (
            <Loader size={28} className="spin" />
          ) : (
            <>
              <AlertTriangle size={28} />
              <span>{sent ? "SENT!" : "SOS"}</span>
            </>
          )}
        </span>
      </button>
      <p className="sos-label">
        {sent
          ? "Alert sent to responders"
          : "Press for immediate emergency alert"}
      </p>
    </div>
  );
}
