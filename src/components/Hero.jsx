import OrbitCanvas from "./OrbitCanvas.jsx";

export default function Hero({ clock, distEarth, speedKmh, distMoon, isLive }) {
  const { metDisplay, phase, orionFraction, simDistEarth, simSpeedKmh } = clock;

  const displayDist = isLive && distEarth != null ? distEarth : simDistEarth;
  const displaySpeed = isLive && speedKmh != null ? speedKmh : simSpeedKmh;

  return (
    <section className="hero-section container">
      <div className="hero-inner">
        {/* Left — orbit viz */}
        <div className="orbit-viz-wrapper hud">
          <OrbitCanvas
            orionFraction={orionFraction}
            telemetry={{
              distEarth: displayDist,
              speedKmh: displaySpeed,
              isLive,
            }}
          />
        </div>

        {/* Right — metrics */}
        <div className="hero-info">
          {/* Mission elapsed time */}
          <div className="met-block hud">
            <div className="met-label">MISSION ELAPSED TIME</div>
            <div className="met-value">{metDisplay}</div>
          </div>

          {/* Current phase */}
          <div className="phase-block hud">
            <div className="phase-label">CURRENT PHASE</div>
            <div className="phase-value">{phase?.name || "—"}</div>
            <div className="phase-desc">{phase?.desc || ""}</div>
          </div>

          {/* Quick stats */}
          <div className="quick-stats">
            <StatMini
              label="DIST EARTH"
              value={
                displayDist != null
                  ? Math.round(displayDist).toLocaleString()
                  : "—"
              }
              unit="km"
              color="var(--cyan)"
            />
            <StatMini
              label="VELOCITY"
              value={
                displaySpeed != null
                  ? Math.round(displaySpeed).toLocaleString()
                  : "—"
              }
              unit="km/h"
              color="var(--amber)"
            />
            <StatMini
              label="DIST MOON"
              value={
                distMoon != null ? Math.round(distMoon).toLocaleString() : "—"
              }
              unit="km"
              color="rgba(180,170,160,0.8)"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatMini({ label, value, unit, color }) {
  return (
    <div className="stat-mini hud">
      <div className="stat-mini-label">{label}</div>
      <div className="stat-mini-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-mini-unit">{unit}</div>
    </div>
  );
}
