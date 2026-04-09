import { useState, useEffect } from 'react';
import { TIMELINE_EVENTS, MISSION } from '../data/missionData';

// Major milestones shown on the horizontal progress track
const TRACK_MILESTONES = [
  { label: 'LAUNCH',  pct:  0.0, status: 'complete' },
  { label: 'TLI',     pct: 11.5, status: 'complete' },
  { label: 'FLYBY',   pct: 46.5, status: 'complete' },
  { label: 'RPF',     pct: 67.4, status: 'complete' },
  { label: 'RETURN',  pct: 67.7, status: 'active'   },
  { label: 'MCC-R2',  pct: 79.1, status: 'upcoming' },
  { label: 'ENTRY',   pct: 89.5, status: 'upcoming' },
  { label: 'SPLASH',  pct: 100,  status: 'upcoming' },
];

function getMissionProgress() {
  const now   = Date.now();
  const start = MISSION.launchTime.getTime();
  const end   = MISSION.splashdownTime.getTime();
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

export default function Timeline() {
  const [progress, setProgress] = useState(getMissionProgress);

  useEffect(() => {
    const id = setInterval(() => setProgress(getMissionProgress()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="timeline-section">
      <div className="container">
        <h2 className="section-title">MISSION TIMELINE</h2>

        {/* ── Horizontal mission progress track ── */}
        <div className="mission-track hud">
          <div className="track-header">
            <span className="track-title">MISSION PROGRESS OVERVIEW</span>
            <span className="track-pct">{progress.toFixed(1)}% COMPLETE</span>
          </div>

          <div className="track-bar-wrap">
            {/* Filled progress */}
            <div className="track-bg-line" />
            <div className="track-fill" style={{ width: `${progress}%` }} />

            {/* Event milestone markers */}
            {TRACK_MILESTONES.map((m, i) => (
              <div
                key={i}
                className={`track-marker track-marker-${m.status}`}
                style={{ left: `${m.pct}%` }}
              >
                <div className="track-dot" />
                <span className="track-ml">{m.label}</span>
              </div>
            ))}

            {/* Orion current position */}
            <div className="track-orion" style={{ left: `${progress}%` }}>
              <span className="track-orion-label">ORION</span>
              <div className="track-orion-dot" />
            </div>
          </div>
        </div>

        {/* ── Event cards grid ── */}
        <div className="tl-grid">
          {TIMELINE_EVENTS.map((ev, i) => {
            const badgeText =
              ev.status === 'complete' ? '✓ COMPLETE' :
              ev.status === 'active'   ? '● IN PROGRESS' :
                                         '◌ UPCOMING';
            const dateStr = ev.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeStr = ev.time.toISOString().slice(11, 16) + ' UTC';
            return (
              <div key={i} className={`tl-card hud tl-${ev.status}`}>
                <div className="tl-card-top">
                  <span className={`tl-dot tl-dot-${ev.status}`} />
                  <span className="tl-name">{ev.name}</span>
                </div>
                <div className="tl-desc">{ev.desc}</div>
                <div className="tl-footer">
                  <span className="tl-time">{dateStr} · {timeStr}</span>
                  <span className={`tl-badge tl-badge-${ev.status}`}>{badgeText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

