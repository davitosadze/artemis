const C_OF_LIGHT = 299792; // km/s

function signalDelaySec(distKm) {
  return distKm ? distKm / C_OF_LIGHT : null;
}

function formatDelay(sec) {
  if (sec == null) return "—";
  if (sec < 1) return `${(sec * 1000).toFixed(0)} ms`;
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function machNumber(kmh) {
  if (kmh == null) return null;
  return kmh / 1236; // 1 Mach ≈ 1236 km/h at sea level
}

export default function TelemetryGrid({
  distEarth,
  speedKmh,
  simDistEarth,
  simSpeedKmh,
  simDistMoon,
  isLive,
}) {
  // Always use sim values so numbers tick every second.
  // isLive / distEarth / speedKmh are only used for the status badge.
  const dE = simDistEarth;
  const vKmh = simSpeedKmh;
  const dM = simDistMoon;
  const delay = signalDelaySec(dE);
  const mach = machNumber(vKmh);

  // Normalise bar fills
  const distEBar = dE != null ? Math.min(1, dE / 400000) : 0;
  const speedBar = vKmh != null ? Math.min(1, vKmh / 40000) : 0;
  const moonBar = dM != null ? Math.min(1, dM / 400000) : 0;
  const delayBar = delay != null ? Math.min(1, delay / 1.5) : 0;

  return (
    <div className="telemetry-grid">
      {/* Distance to Earth */}
      <div className="telem-card hud">
        <div className="telem-icon-row">
          <span className="telem-icon">🌍</span>
          <span className="telem-label">DISTANCE · EARTH</span>
        </div>
        <div className="telem-value" style={{ color: "var(--cyan)" }}>
          {dE != null ? Math.round(dE).toLocaleString() : "—"}
        </div>
        <div className="telem-unit">km</div>
        <div className="telem-bar">
          <div
            className="telem-bar-fill"
            style={{ width: `${distEBar * 100}%`, background: "var(--cyan)" }}
          />
        </div>
      </div>

      {/* Velocity */}
      <div className="telem-card hud">
        <div className="telem-icon-row">
          <span className="telem-icon">⚡</span>
          <span className="telem-label">VELOCITY</span>
        </div>
        <div className="telem-value" style={{ color: "var(--amber)" }}>
          {vKmh != null ? Math.round(vKmh).toLocaleString() : "—"}
        </div>
        <div className="telem-unit">
          km/h{mach != null ? ` · Mach ${mach.toFixed(1)}` : ""}
        </div>
        <div className="telem-bar">
          <div
            className="telem-bar-fill"
            style={{ width: `${speedBar * 100}%`, background: "var(--amber)" }}
          />
        </div>
      </div>

      {/* Distance to Moon */}
      <div className="telem-card hud">
        <div className="telem-icon-row">
          <span className="telem-icon">🌕</span>
          <span className="telem-label">DISTANCE · MOON</span>
        </div>
        <div className="telem-value" style={{ color: "rgba(210,200,185,0.9)" }}>
          {dM != null ? Math.round(dM).toLocaleString() : "—"}
        </div>
        <div className="telem-unit">km</div>
        <div className="telem-bar">
          <div
            className="telem-bar-fill"
            style={{
              width: `${moonBar * 100}%`,
              background: "rgba(200,190,170,0.5)",
            }}
          />
        </div>
      </div>

      {/* Signal delay */}
      <div className="telem-card hud">
        <div className="telem-icon-row">
          <span className="telem-icon">📡</span>
          <span className="telem-label">SIGNAL DELAY</span>
        </div>
        <div className="telem-value" style={{ color: "var(--green)" }}>
          {formatDelay(delay)}
        </div>
        <div className="telem-unit">one-way light time</div>
        <div className="telem-bar">
          <div
            className="telem-bar-fill"
            style={{ width: `${delayBar * 100}%`, background: "var(--green)" }}
          />
        </div>
      </div>
    </div>
  );
}
