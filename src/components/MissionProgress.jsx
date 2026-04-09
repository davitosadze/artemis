import { useState, useEffect } from "react";
import { MISSION } from "../data/missionData";

const TRACK_MILESTONES = [
  { label: "LAUNCH", pct: 0.0, status: "complete" },
  { label: "TLI", pct: 11.5, status: "complete" },
  { label: "FLYBY", pct: 46.5, status: "complete" },
  { label: "RPF", pct: 67.4, status: "complete" },
  { label: "RETURN", pct: 67.7, status: "active" },
  { label: "MCC-R2", pct: 79.1, status: "upcoming" },
  { label: "ENTRY", pct: 89.5, status: "upcoming" },
  { label: "SPLASH", pct: 100, status: "upcoming" },
];

function getMissionProgress() {
  const now = Date.now();
  const start = MISSION.launchTime.getTime();
  const end = MISSION.splashdownTime.getTime();
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export default function MissionProgress() {
  const [progress, setProgress] = useState(getMissionProgress);

  useEffect(() => {
    const id = setInterval(() => setProgress(getMissionProgress()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mp-strip">
      <div className="container">
        <div className="mp-inner hud">
          <div className="mp-header">
            <span className="mp-title">MISSION PROGRESS</span>
            <span className="mp-label">ARTEMIS II · CREWED LUNAR FLYBY</span>
            <span className="mp-pct">{progress.toFixed(1)}% COMPLETE</span>
          </div>

          <div className="mp-track-wrap">
            <div className="mp-bg-line" />
            <div className="mp-fill" style={{ width: `${progress}%` }} />

            {TRACK_MILESTONES.map((m, i) => (
              <div
                key={i}
                className={`mp-marker mp-marker-${m.status}`}
                style={{ left: `${m.pct}%` }}>
                <div className="mp-dot" />
                <span className="mp-ml">{m.label}</span>
              </div>
            ))}

            {/* Orion current position */}
            <div className="mp-orion" style={{ left: `${progress}%` }}>
              <span className="mp-orion-lbl">ORION II</span>
              <div className="mp-orion-dot" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
