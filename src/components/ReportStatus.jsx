// src/components/ReportStatus.jsx
import React from "react";
import { CheckCircle, Clock, Eye, Truck, XCircle } from "lucide-react";
import "./ReportStatus.css";

const STEPS = [
  { key: "pending", label: "Report Received", icon: Clock },
  { key: "reviewing", label: "Admin Reviewing", icon: Eye },
  { key: "verified", label: "Verified", icon: CheckCircle },
  { key: "dispatched", label: "Help Dispatched", icon: Truck },
];

const ORDER = ["pending", "reviewing", "verified", "dispatched"];

export default function ReportStatus({ status }) {
  const currentIndex = ORDER.indexOf(status);
  const isFake = status === "fake";

  if (isFake) {
    return (
      <div className="status-tracker fake">
        <XCircle size={20} />
        <span>Report marked as fake / duplicate</span>
      </div>
    );
  }

  return (
    <div className="status-tracker">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={step.key}>
            <div className={`status-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
              <div className="step-icon">
                <Icon size={15} />
              </div>
              <span className="step-label">{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-line ${i < currentIndex ? "done" : ""}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
