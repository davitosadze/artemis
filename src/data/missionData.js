export const MISSION = {
  launchTime:     new Date('2026-04-01T00:35:00Z'),
  splashdownTime: new Date('2026-04-11T00:00:00Z'),
  SPEED_OF_LIGHT_KMS: 299792.458,
};

export const PHASES = [
  { after: new Date('2026-04-07T18:30:00Z'), name: 'RETURN COAST',   desc: 'Orion coasting back toward Earth' },
  { after: new Date('2026-04-09T21:45:00Z'), name: 'MCC-R2 BURN',    desc: 'Trajectory correction burn in progress' },
  { after: new Date('2026-04-09T22:15:00Z'), name: 'FINAL APPROACH', desc: 'Earth gravity pulling Orion home' },
  { after: new Date('2026-04-10T22:30:00Z'), name: 'ENTRY & LANDING',desc: 'Atmospheric entry and splashdown' },
  { after: new Date('2026-04-11T00:00:00Z'), name: 'MISSION COMPLETE',desc: 'Crew recovered safely' },
];

export const TIMELINE_EVENTS = [
  { name: 'LAUNCH — LC-39B KSC',           desc: 'SLS lifts off from Kennedy Space Center',                       time: new Date('2026-04-01T00:35:00Z'), status: 'complete' },
  { name: 'MECO + LAS JETTISON',            desc: 'Core stage separation, launch abort system jettisoned',         time: new Date('2026-04-01T00:43:00Z'), status: 'complete' },
  { name: 'SOLAR ARRAY DEPLOY',             desc: '4 SAW wings unfurl on Orion',                                   time: new Date('2026-04-01T00:55:00Z'), status: 'complete' },
  { name: 'ICPS BURNS — PRM + ARB',         desc: 'Orbit raise burns completed',                                    time: new Date('2026-04-01T02:15:00Z'), status: 'complete' },
  { name: 'PROXIMITY OPS DEMO',             desc: 'Glover manually pilots Orion near ICPS',                         time: new Date('2026-04-01T04:00:00Z'), status: 'complete' },
  { name: 'ICPS DISPOSAL BURN',             desc: 'ICPS deorbited safely',                                          time: new Date('2026-04-01T06:00:00Z'), status: 'complete' },
  { name: 'HIGH EARTH ORBIT',               desc: '24-hour systems checkout completed',                             time: new Date('2026-04-02T00:35:00Z'), status: 'complete' },
  { name: 'TRANSLUNAR INJECTION',           desc: '30-min TLI burn toward the Moon',                                time: new Date('2026-04-02T04:00:00Z'), status: 'complete' },
  { name: 'TRAJECTORY CORRECTION 1',        desc: 'MCC-1 outbound — cancelled (nominal trajectory)',                time: new Date('2026-04-03T12:00:00Z'), status: 'complete' },
  { name: 'TRAJECTORY CORRECTION 2',        desc: 'MCC-2 pre-flyby fine-tune completed',                            time: new Date('2026-04-04T08:00:00Z'), status: 'complete' },
  { name: 'LUNAR FLYBY',                    desc: 'Orion swings around the Moon at ~100 km',                        time: new Date('2026-04-05T16:00:00Z'), status: 'complete' },
  { name: 'OUTBOUND POWERED FLYBY',         desc: 'OPF burn — Moon gravity assist',                                  time: new Date('2026-04-05T16:45:00Z'), status: 'complete' },
  { name: 'DEEP SPACE TRANSIT',             desc: 'Crew experiences deep space, farthest humans from Earth',        time: new Date('2026-04-06T00:00:00Z'), status: 'complete' },
  { name: 'RETURN POWERED FLYBY',           desc: 'RPF burn — trajectory set for Earth return',                     time: new Date('2026-04-07T18:00:00Z'), status: 'complete' },
  { name: 'RETURN COAST',                   desc: 'Orion coasting back toward Earth — in progress',                 time: new Date('2026-04-07T18:30:00Z'), status: 'active'   },
  { name: 'RETURN TRAJ. CORRECTION 2',      desc: 'MCC-R2 — second homeward burn to refine entry angle',            time: new Date('2026-04-09T22:00:00Z'), status: 'upcoming' },
  { name: 'ENTRY INTERFACE',                desc: 'Orion hits atmosphere at ~125 km altitude',                      time: new Date('2026-04-10T23:00:00Z'), status: 'upcoming' },
  { name: 'SPLASHDOWN — PACIFIC',           desc: 'Crew safely recovered at sea',                                   time: new Date('2026-04-11T00:00:00Z'), status: 'upcoming' },
];

export const COVERAGE_EVENTS = [
  { name: 'FD9 — Crew Wakeup',         desc: 'Last full day in space begins',              time: new Date('2026-04-09T15:35:00Z') },
  { name: 'FD9 — Live Downlink',        desc: 'Crew farewell messages from deep space',     time: new Date('2026-04-09T18:00:00Z') },
  { name: 'RETURN TRAJECTORY BURN',     desc: 'MCC-R2 coverage begins',                    time: new Date('2026-04-09T21:45:00Z') },
  { name: 'FD10 — Entry Coverage',      desc: 'Atmospheric entry and splashdown',           time: new Date('2026-04-10T22:00:00Z') },
];

export const MANEUVER_EVENTS = [
  { name: 'RETURN TRAJECTORY CORRECTION 2', desc: 'MCC-R2 — second homeward burn', time: new Date('2026-04-09T22:00:00Z') },
  { name: 'ENTRY INTERFACE',                desc: 'Atmospheric entry point at 125 km',     time: new Date('2026-04-10T23:00:00Z') },
  { name: 'SPLASHDOWN',                     desc: 'Pacific Ocean recovery',                time: new Date('2026-04-11T00:00:00Z') },
];

export const CREW = [
  { initials: 'RV', name: 'Reid Wiseman',   role: 'Commander',          agency: 'NASA', color1: '#1a3a6b', color2: '#0a1f3d' },
  { initials: 'VG', name: 'Victor Glover',  role: 'Pilot',              agency: 'NASA', color1: '#1a3a6b', color2: '#0a1f3d' },
  { initials: 'CH', name: 'Christina Koch', role: 'Mission Specialist',  agency: 'NASA', color1: '#2d1a6b', color2: '#160a3d' },
  { initials: 'JH', name: 'Jeremy Hansen',  role: 'Mission Specialist',  agency: 'CSA',  color1: '#1a4a2a', color2: '#0a2010' },
];
