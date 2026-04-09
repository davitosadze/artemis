import { TIMELINE_EVENTS } from "../data/missionData";

export default function Timeline() {
  return (
    <section className="timeline-section">
      <div className="container">
        <h2 className="section-title">MISSION TIMELINE</h2>

        {/* ── Event cards grid ── */}
        <div className="tl-grid">
          {TIMELINE_EVENTS.map((ev, i) => {
            const badgeText =
              ev.status === "complete"
                ? "✓ COMPLETE"
                : ev.status === "active"
                  ? "● IN PROGRESS"
                  : "◌ UPCOMING";
            const dateStr = ev.time.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const timeStr = ev.time.toISOString().slice(11, 16) + " UTC";
            return (
              <div key={i} className={`tl-card hud tl-${ev.status}`}>
                <div className="tl-card-top">
                  <span className={`tl-dot tl-dot-${ev.status}`} />
                  <span className="tl-name">{ev.name}</span>
                </div>
                <div className="tl-desc">{ev.desc}</div>
                <div className="tl-footer">
                  <span className="tl-time">
                    {dateStr} · {timeStr}
                  </span>
                  <span className={`tl-badge tl-badge-${ev.status}`}>
                    {badgeText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
