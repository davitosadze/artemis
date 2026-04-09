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
const TRAJ_DIST = [
  [0.0, 0],
  [0.03, 8000],
  [0.12, 55000],
  [0.28, 185000],
  [0.45, 345000],
  [0.5, 384400],
  [0.54, 390000],
  [0.64, 395000],
  [0.72, 358000],
  [0.8, 268000],
  [0.87, 170000],
  [0.945, 48000],
  [1.0, 6500],
];

// Approximate spacecraft speed at each trajectory fraction (km/h)
const TRAJ_SPEED = [
  [0.0, 36000],
  [0.12, 10500],
  [0.28, 5200],
  [0.45, 3900],
  [0.5, 3700],
  [0.54, 3900],
  [0.64, 5000],
  [0.72, 7500],
  [0.8, 11000],
  [0.87, 17000],
  [0.945, 30000],
  [1.0, 40000],
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
