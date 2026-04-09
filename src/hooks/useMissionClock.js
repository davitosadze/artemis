import { useState, useEffect } from 'react';
import { MISSION, PHASES, MANEUVER_EVENTS, COVERAGE_EVENTS } from '../data/missionData';

const pad2 = (n) => String(Math.floor(n)).padStart(2, '0');

function getCurrentPhase(nowMs) {
  let result = { name: 'PRE-LAUNCH', desc: 'Awaiting liftoff' };
  for (const p of PHASES) {
    if (nowMs >= p.after.getTime()) result = p;
  }
  return result;
}

function getOrionFraction(nowMs) {
  const returnStart = new Date('2026-04-07T18:30:00Z').getTime();
  const splashdown  = MISSION.splashdownTime.getTime();
  return Math.max(0, Math.min(1, (nowMs - returnStart) / (splashdown - returnStart)));
}

function formatEta(ms) {
  if (ms <= 0) return '— PASSED —';
  const totalSec = Math.floor(ms / 1000);
  return `${pad2(Math.floor(totalSec / 3600))}h ${pad2(Math.floor((totalSec % 3600) / 60))}m ${pad2(totalSec % 60)}s`;
}

function compute() {
  const now   = new Date();
  const nowMs = now.getTime();

  // UTC clock
  const utc = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(now.getUTCSeconds())} UTC`;

  // Mission Elapsed Time
  const metMs = nowMs - MISSION.launchTime.getTime();
  let metDisplay = 'T- LAUNCH';
  if (metMs > 0) {
    const s   = Math.floor(metMs / 1000);
    const d   = Math.floor(s / 86400);
    const h   = Math.floor((s % 86400) / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    metDisplay = `T+ ${d}d ${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
  }

  // Phase
  const phase = getCurrentPhase(nowMs);

  // Orbit fraction + simulated telemetry
  const orionFraction = getOrionFraction(nowMs);
  const curve         = orionFraction * orionFraction * (3 - 2 * orionFraction); // smoothstep
  const simDistEarth  = Math.round(390000 * (1 - curve) + 6496 * curve);
  const simDistMoon   = Math.round(25000  * (1 - orionFraction) + 395000 * orionFraction);
  const simSpeedKmh   = Math.round(8000 + curve * 28000);

  // Splashdown countdown
  const splashMs  = MISSION.splashdownTime.getTime() - nowMs;
  const splashSec = Math.max(0, Math.floor(splashMs / 1000));
  const splashdown = {
    days:  pad2(Math.floor(splashSec / 86400)),
    hours: pad2(Math.floor((splashSec % 86400) / 3600)),
    mins:  pad2(Math.floor((splashSec % 3600) / 60)),
    secs:  pad2(splashSec % 60),
  };

  // Next maneuver / coverage ETAs
  const nextManeuver  = MANEUVER_EVENTS.find(e => e.time.getTime() > nowMs) || null;
  const maneuverEta   = nextManeuver  ? formatEta(nextManeuver.time.getTime()  - nowMs) : '—';
  const nextCoverage  = COVERAGE_EVENTS.find(e => e.time.getTime() > nowMs) || null;
  const coverageEta   = nextCoverage  ? formatEta(nextCoverage.time.getTime()  - nowMs) : '—';

  return { utc, metDisplay, phase, orionFraction, simDistEarth, simDistMoon, simSpeedKmh, splashdown, nextManeuver, maneuverEta, nextCoverage, coverageEta };
}

export default function useMissionClock() {
  const [state, setState] = useState(() => compute());

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  }, []);

  return state;
}
