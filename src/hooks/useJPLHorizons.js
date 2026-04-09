import { useState, useEffect, useCallback } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtJPL(d) {
  return (
    `${d.getUTCFullYear()}-${MONTHS[d.getUTCMonth()]}-${String(d.getUTCDate()).padStart(2,'0')}` +
    `%20${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
  );
}

async function fetchTelemetry() {
  const now    = new Date();
  const tStart = fmtJPL(now);
  const tEnd   = fmtJPL(new Date(now.getTime() + 120000));

  // Route through /.netlify/functions/horizons:
  //   • In dev:  Vite proxy rewrites this to https://ssd.jpl.nasa.gov/api/horizons.api
  //   • In prod: Netlify Function handles it server-side (no CORS issue)
  const url =
    '/.netlify/functions/horizons?format=json' +
    '&COMMAND=%27-1024%27' +       // Artemis II spacecraft (verified Horizons ID)
    '&OBJ_DATA=%27NO%27' +
    '&MAKE_EPHEM=%27YES%27' +
    '&EPHEM_TYPE=%27OBSERVER%27' +
    '&CENTER=%27500%40399%27' +    // Earth geocenter
    `&START_TIME=%27${tStart}%27` +
    `&STOP_TIME=%27${tEnd}%27` +
    '&STEP_SIZE=%271m%27' +
    '&QUANTITIES=%2720%2C21%27';   // 20=range+range-rate, 21=light-time

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!data.result?.includes('$$SOE')) throw new Error('No SOE block');

  const block = data.result.split('$$SOE')[1].split('$$EOE')[0].trim();
  const lines = block.split('\n').filter(l => l.trim());
  if (!lines.length) throw new Error('Empty SOE');

  // Line: "YYYY-Mon-DD HH:MM   delta_AU   deldot_km/s   1way_LT_min"
  const parts    = lines[0].trim().split(/\s+/);
  const rangeAU  = parseFloat(parts[parts.length - 3]);
  const rangeKm  = rangeAU * 149597870.7;
  const rateKmS  = parseFloat(parts[parts.length - 2]);
  const speedKmh = Math.abs(rateKmS) * 3600;

  if (isNaN(rangeKm) || rangeKm <= 0 || rangeKm > 500000) {
    throw new Error(`Implausible range: ${rangeKm.toFixed(0)} km`);
  }

  return { distEarth: Math.round(rangeKm), speedKmh: Math.round(speedKmh) };
}

export default function useJPLHorizons() {
  const [jpl, setJpl]       = useState(null);
  const [isLive, setIsLive] = useState(false);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchTelemetry();
      setJpl(result);
      setIsLive(true);
      console.log(`[JPL] ✓ ${result.distEarth.toLocaleString()} km · ${result.speedKmh.toLocaleString()} km/h`);
    } catch (e) {
      console.warn('[JPL] Fetch failed:', e.message);
      setIsLive(false);
    }
  }, []);

  useEffect(() => {
    doFetch();
    const id = setInterval(doFetch, 60000);
    return () => clearInterval(id);
  }, [doFetch]);

  return {
    distEarth: jpl ? jpl.distEarth : null,
    speedKmh:  jpl ? jpl.speedKmh  : null,
    isLive,
  };
}
