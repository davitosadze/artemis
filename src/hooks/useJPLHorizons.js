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
    "&COMMAND=%27-1024%27" + // Artemis II / Orion
    "&OBJ_DATA=%27NO%27" +
    "&MAKE_EPHEM=%27YES%27" +
    "&EPHEM_TYPE=%27VECTORS%27" +
    "&CENTER=%27500%40399%27" + // Earth geocenter
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

  // VEC_TABLE=2 gives: line0=epoch, line1="X=... Y=... Z=...", line2="VX=... VY=... VZ=..."
  // Compute range = sqrt(X²+Y²+Z²), speed = sqrt(VX²+VY²+VZ²)
  let X = NaN, Y = NaN, Z = NaN;
  let VX = NaN, VY = NaN, VZ = NaN;
  const NUM = /[-+]?[\d.]+(?:[Ee][+-]?\d+)?/;

  for (const line of lines) {
    if (isNaN(X)) {
      const mX = line.match(new RegExp(`\\bX\\s*=\\s*(${NUM.source})`));
      const mY = line.match(new RegExp(`\\bY\\s*=\\s*(${NUM.source})`));
      const mZ = line.match(new RegExp(`\\bZ\\s*=\\s*(${NUM.source})`));
      if (mX && mY && mZ) {
        X = parseFloat(mX[1]);
        Y = parseFloat(mY[1]);
        Z = parseFloat(mZ[1]);
      }
    }
    if (isNaN(VX)) {
      const mVX = line.match(new RegExp(`\\bVX\\s*=\\s*(${NUM.source})`));
      const mVY = line.match(new RegExp(`\\bVY\\s*=\\s*(${NUM.source})`));
      const mVZ = line.match(new RegExp(`\\bVZ\\s*=\\s*(${NUM.source})`));
      if (mVX && mVY && mVZ) {
        VX = parseFloat(mVX[1]);
        VY = parseFloat(mVY[1]);
        VZ = parseFloat(mVZ[1]);
      }
    }
    if (!isNaN(X) && !isNaN(VX)) break;
  }

  if (isNaN(X) || isNaN(VX)) {
    throw new Error(
      `Could not parse X/Y/Z or VX/VY/VZ from VECTORS block. Check console for raw block.`,
    );
  }

  const rangeKm = Math.sqrt(X * X + Y * Y + Z * Z);
  const speedKmh = Math.sqrt(VX * VX + VY * VY + VZ * VZ) * 3600;
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
