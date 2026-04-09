import { useState, useEffect } from "react";
import {
  MISSION,
  PHASES,
  MANEUVER_EVENTS,
  COVERAGE_EVENTS,
} from "../data/missionData";

const pad2 = (n) => String(Math.floor(n)).padStart(2, "0");

function getCurrentPhase(nowMs) {
  let result = { name: "PRE-LAUNCH", desc: "Awaiting liftoff" };
  for (const p of PHASES) {
    if (nowMs >= p.after.getTime()) result = p;
  }
  return result;
}

// Mirrors the TRAJECTORY waypoints in OrbitCanvas — [missionFraction, distFromEarth_km]
// Calibrated: day 8 (frac 0.780) = 246,000 km confirmed by JPL Horizons
const TRAJ_DIST = [
  [0.000,    350],
  [0.030,   8000],
  [0.115,  57000],
  [0.250, 165000],
  [0.380, 295000],
  [0.440, 355000],
  [0.460, 376000],
  [0.472, 384400], // Moon flyby
  [0.490, 393400], // Far-side maximum
  [0.505, 392000],
  [0.530, 386000],
  [0.570, 368000],
  [0.650, 330000],
  [0.780, 246000], // JPL confirmed
  [0.870, 155000],
  [0.940,  45000],
  [1.000,   6500],
];

// Physics-based speeds (km/h) via vis-viva: v²=GM·(2/r−1/a)
// Semi-major axis a≈227,400 km derived from JPL day-8 observation
// Calibrated anchor: frac 0.780 = 4,384 km/h (JPL confirmed)
const TRAJ_SPEED = [
  [0.000, 39000], // TLI burn (~10.8 km/s)
  [0.030, 35500], // r=8,000 km
  [0.115, 12500], // r=57,000 km
  [0.250,  6300], // r=165,000 km
  [0.380,  3500], // r=295,000 km
  [0.472,  2050], // r=384,400 km (Moon flyby)
  [0.505,  1890], // r=392,000 km (near apoapsis — minimum speed)
  [0.650,  3100], // r=330,000 km
  [0.780,  4384], // r=246,000 km — JPL confirmed
  [0.870,  6600], // r=155,000 km
  [0.940, 14000], // r=45,000 km
  [1.000, 39500], // Entry/splashdown (~11 km/s)
];

function trajInterp(table, frac) {
  if (frac <= table[0][0]) return table[0][1];
  if (frac >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [t0, v0] = table[i];
    const [t1, v1] = table[i + 1];
    if (frac >= t0 && frac <= t1) {
      return v0 + ((v1 - v0) * (frac - t0)) / (t1 - t0);
    }
  }
  return table[table.length - 1][1];
}

// orionFraction = 0 at launch, 1 at splashdown — same scale as the canvas spline
function getOrionFraction(nowMs) {
  const start = MISSION.launchTime.getTime();
  const end = MISSION.splashdownTime.getTime();
  return Math.max(0, Math.min(1, (nowMs - start) / (end - start)));
}

function formatEta(ms) {
  if (ms <= 0) return "— PASSED —";
  const totalSec = Math.floor(ms / 1000);
  return `${pad2(Math.floor(totalSec / 3600))}h ${pad2(Math.floor((totalSec % 3600) / 60))}m ${pad2(totalSec % 60)}s`;
}

function compute() {
  const now = new Date();
  const nowMs = now.getTime();

  // UTC clock
  const utc = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())} UTC`;

  // Mission Elapsed Time
  const metMs = nowMs - MISSION.launchTime.getTime();
  let metDisplay = "T- LAUNCH";
  if (metMs > 0) {
    const s = Math.floor(metMs / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    metDisplay = `T+ ${d}d ${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
  }

  // Phase
  const phase = getCurrentPhase(nowMs);

  // Orbit fraction (0=launch → 1=splashdown) — matches the full canvas spline
  const orionFraction = getOrionFraction(nowMs);
  const simDistEarth = Math.round(trajInterp(TRAJ_DIST, orionFraction));
  const simSpeedKmh = Math.round(trajInterp(TRAJ_SPEED, orionFraction));
  // Distance to Moon: approximate as |Moon orbit radius − dist from Earth|
  const simDistMoon = Math.round(Math.abs(384400 - simDistEarth));

  // Splashdown countdown
  const splashMs = MISSION.splashdownTime.getTime() - nowMs;
  const splashSec = Math.max(0, Math.floor(splashMs / 1000));
  const splashdown = {
    days: pad2(Math.floor(splashSec / 86400)),
    hours: pad2(Math.floor((splashSec % 86400) / 3600)),
    mins: pad2(Math.floor((splashSec % 3600) / 60)),
    secs: pad2(splashSec % 60),
  };

  // Next maneuver / coverage ETAs
  const nextManeuver =
    MANEUVER_EVENTS.find((e) => e.time.getTime() > nowMs) || null;
  const maneuverEta = nextManeuver
    ? formatEta(nextManeuver.time.getTime() - nowMs)
    : "—";
  const nextCoverage =
    COVERAGE_EVENTS.find((e) => e.time.getTime() > nowMs) || null;
  const coverageEta = nextCoverage
    ? formatEta(nextCoverage.time.getTime() - nowMs)
    : "—";

  return {
    utc,
    metDisplay,
    phase,
    orionFraction,
    simDistEarth,
    simDistMoon,
    simSpeedKmh,
    splashdown,
    nextManeuver,
    maneuverEta,
    nextCoverage,
    coverageEta,
  };
}

export default function useMissionClock() {
  const [state, setState] = useState(() => compute());

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
