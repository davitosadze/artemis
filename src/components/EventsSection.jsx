const fmt = (n) => Math.round(n).toLocaleString("en-US");

const fmtDate = (t) =>
  t ? t.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const fmtDateFull = (t) =>
  t
    ? fmtDate(t) +
      " · " +
      t.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "—";

export default function EventsSection({
  nextManeuver,
  maneuverEta,
  nextCoverage,
  coverageEta,
  splashdown,
  distEarth,
  distEarthMi,
}) {
  return (
    <section className="events-section">
      <div className="container">
        <h2 className="section-title">MISSION EVENTS</h2>
        <div className="events-grid">
          {/* Next Maneuver */}
          <div className="event-panel hud maneuver-panel">
            <div className="panel-header">
              <span className="panel-icon">🔥</span>
              <span className="panel-title">NEXT MANEUVER</span>
            </div>
            <div className="maneuver-name">
              {nextManeuver ? nextManeuver.name : "NO UPCOMING MANEUVERS"}
            </div>
            <div className="maneuver-desc">
              {nextManeuver ? nextManeuver.desc : "—"}
            </div>
            <div className="maneuver-eta">
              <span className="eta-label">ETA</span>
              <span className="eta-value">{maneuverEta}</span>
            </div>
            <div className="maneuver-date">{fmtDate(nextManeuver?.time)}</div>
          </div>

          {/* Next Coverage */}
          <div className="event-panel hud coverage-panel">
            <div className="panel-header">
              <span className="panel-icon">📺</span>
              <span className="panel-title">NASA COVERAGE EVENT</span>
            </div>
            <div className="maneuver-name">
              {nextCoverage ? nextCoverage.name : "NO UPCOMING COVERAGE"}
            </div>
            <div className="maneuver-desc">
              {nextCoverage ? nextCoverage.desc : "—"}
            </div>
            <div className="maneuver-eta">
              <span className="eta-label">ETA</span>
              <span className="eta-value">{coverageEta}</span>
            </div>
            <div className="maneuver-date">
              {fmtDateFull(nextCoverage?.time)}
            </div>
          </div>

          {/* Splashdown Countdown */}
          <div className="event-panel hud splashdown-panel">
            <div className="panel-header">
              <span className="panel-icon">🌊</span>
              <span className="panel-title">SPLASHDOWN — PACIFIC OCEAN</span>
            </div>
            <div className="splashdown-countdown">
              <div className="cd-block">
                <span className="cd-num">{splashdown.days}</span>
                <span className="cd-lbl">DAYS</span>
              </div>
              <div className="cd-sep">:</div>
              <div className="cd-block">
                <span className="cd-num">{splashdown.hours}</span>
                <span className="cd-lbl">HRS</span>
              </div>
              <div className="cd-sep">:</div>
              <div className="cd-block">
                <span className="cd-num">{splashdown.mins}</span>
                <span className="cd-lbl">MIN</span>
              </div>
              <div className="cd-sep">:</div>
              <div className="cd-block">
                <span className="cd-num">{splashdown.secs}</span>
                <span className="cd-lbl">SEC</span>
              </div>
            </div>
            <div className="splashdown-dist">
              <span>{fmt(distEarth)}</span> KM · <span>{fmt(distEarthMi)}</span>{" "}
              MI remaining
            </div>
          </div>
        </div>
        {/* events-grid */}
      </div>
      {/* container */}
    </section>
  );
}
