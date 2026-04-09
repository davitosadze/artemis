import { useState, useEffect, useCallback } from "react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtJPL(d) {
  return (
    `${d.getUTCFullYear()}-${MONTHS[d.getUTCMonth()]}-${String(d.getUTCDate()).padStart(2, "0")}` +
    `%20${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
  );
}

/** Extract a human-readable error message from a JPL Horizons result block */
function extractJPLError(result = "") {
  const lines = result
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  // JPL errors start with "!$$SOF" or contain "No target" / "ERROR"
  const errLine = lines.find(
    (l) =>
      l.startsWith("!") ||
      /error|no target|no match|cannot find|not found|ephemeris not/i.test(l),
  );
  return errLine ? errLine.replace(/^!+\s*/, "") : result.slice(0, 200);
}

async function fetchTelemetry() {
  const now = new Date();
  const tStart = fmtJPL(now);
  // 30-minute window to guarantee at least one data point
  const tEnd = fmtJPL(new Date(now.getTime() + 30 * 60 * 1000));

  // VECTORS ephemeris, table type 2 = XYZ + VXVYVZ + LT/RG/RR.
  // VEC_LABELS=NO (default) → 4 plain lines per timestep, easier to parse.
  // Line 0: JDTDB + calendar date
  // Line 1: X  Y  Z  (km with OUT_UNITS=KM-S)
  // Line 2: VX VY VZ  (km/s)
  // Line 3: LT(hr)  RG(km)  RR(km/s)
  const url =
    "/.netlify/functions/horizons?format=json" +
    "&COMMAND=%27-1024%27" +     // Artemis II / Orion
    "&OBJ_DATA=%27NO%27" +
    "&MAKE_EPHEM=%27YES%27" +
    "&EPHEM_TYPE=%27VECTORS%27" +
    "&CENTER=%27500%40399%27" +  // Earth geocenter
    "&OUT_UNITS=%27KM-S%27" +
    "&VEC_TABLE=%272%27" +
    "&VEC_CORR=%27NONE%27" +
    `&START_TIME=%27${tStart}%27` +
    `&STOP_TIME=%27${tEnd}%27` +
    "&STEP_SIZE=%2715m%27";

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  if (!data.result?.includes("$$SOE")) {
    const jplErr = extractJPLError(data.result);
    throw new Error(`JPL: ${jplErr}`);
  }

  const block = data.result.split("$$SOE")[1].split("$$EOE")[0].trim();
  const lines = block.split("\n").filter((l) => l.trim());
  if (!lines.length) throw new Error("Empty SOE block");

  // Debug: log raw block so issues are visible in console
  console.log("[JPL] SOE block (first 4 lines):", lines.slice(0, 4));

  let rangeKm = NaN, rateKmS = NaN;

  // Strategy 1 — labeled output (VEC_LABELS=YES): find RG=... anywhere in block
  for (const line of lines) {
    if (isNaN(rangeKm)) {
      const m = line.match(/\bRG\s*=\s*([-+]?[\d.]+(?:[Ee][+-]?\d+)?)/);
      if (m) rangeKm = parseFloat(m[1]);
    }
    if (isNaN(rateKmS)) {
      const m = line.match(/\bRR\s*=\s*([-+]?[\d.]+(?:[Ee][+-]?\d+)?)/);
      if (m) rateKmS = parseFloat(m[1]);
    }
    if (!isNaN(rangeKm) && !isNaN(rateKmS)) break;
  }

  // Strategy 2 — unlabeled VEC_TABLE=2: line index 3 = "LT  RG  RR"
  if (isNaN(rangeKm) && lines.length >= 4) {
    const parts = lines[3].trim().split(/\s+/);
    if (parts.length === 3) {
      rangeKm = parseFloat(parts[1]);
      rateKmS = parseFloat(parts[2]);
    }
  }

  // Strategy 3 — scan for any line that is exactly 3 numbers (LT/RG/RR)
  if (isNaN(rangeKm)) {
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (
        parts.length === 3 &&
        parts.every((p) => /^[-+]?[\d.]+([Ee][+-]?\d+)?$/.test(p))
      ) {
        const candidate = parseFloat(parts[1]);
        if (candidate > 1000 && candidate < 500000) {
          rangeKm = candidate;
          rateKmS = parseFloat(parts[2]);
          break;
        }
      }
    }
  }

  if (isNaN(rangeKm) || rangeKm <= 0 || rangeKm > 500000) {
    throw new Error(
      `Could not parse RG (got: ${rangeKm}). Check console for raw block.`,
    );
  }

  const speedKmh = Math.abs(rateKmS) * 3600;
  return { distEarth: Math.round(rangeKm), speedKmh: Math.round(speedKmh) };
}

export default function useJPLHorizons() {
  const [jpl, setJpl] = useState(null);
  const [isLive, setIsLive] = useState(false);

  const doFetch = useCallback(async () => {
    try {
      const result = await fetchTelemetry();
      setJpl(result);
      setIsLive(true);
      console.log(
        `[JPL] ✓ ${result.distEarth.toLocaleString()} km · ${result.speedKmh.toLocaleString()} km/h`,
      );
    } catch (e) {
      console.warn("[JPL] Fetch failed:", e.message);
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
    speedKmh: jpl ? jpl.speedKmh : null,
    isLive,
  };
}
