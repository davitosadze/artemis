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
  // 30-minute window to guarantee at least one VECTORS data point
  const tEnd = fmtJPL(new Date(now.getTime() + 30 * 60 * 1000));

  // VECTORS ephemeris — more reliable than OBSERVER for spacecraft.
  // OUT_UNITS=KM-S gives distance in km and velocity in km/s directly.
  // VEC_LABELS=YES puts RG (range km) and RR (range-rate km/s) in the output.
  const url =
    "/.netlify/functions/horizons?format=json" +
    "&COMMAND=%27-1024%27" + // Artemis II / Orion capsule
    "&OBJ_DATA=%27NO%27" +
    "&MAKE_EPHEM=%27YES%27" +
    "&EPHEM_TYPE=%27VECTORS%27" +
    "&CENTER=%27500%40399%27" + // Earth geocenter (500 = geocenter, @399 = Earth)
    "&OUT_UNITS=%27KM-S%27" +
    "&VEC_TABLE=%272%27" + // table type 2: state + LT/RG/RR
    "&VEC_LABELS=%27YES%27" +
    `&START_TIME=%27${tStart}%27` +
    `&STOP_TIME=%27${tEnd}%27` +
    "&STEP_SIZE=%2715m%27"; // one step every 15 min — always get at least 1

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();

  if (!data.result?.includes("$$SOE")) {
    // Surface the real JPL error instead of a generic message
    const jplErr = extractJPLError(data.result);
    throw new Error(`JPL: ${jplErr}`);
  }

  const block = data.result.split("$$SOE")[1].split("$$EOE")[0].trim();
  const lines = block.split("\n").filter((l) => l.trim());
  if (!lines.length) throw new Error("Empty SOE block");

  // VECTORS table-2 with VEC_LABELS=YES — each step is 4 lines:
  //   line 0: JDTDB = ... Cal date ...
  //   line 1: X = ...  Y = ...  Z = ...
  //   line 2: VX = ... VY = ... VZ = ...
  //   line 3: LT = ... RG = ... RR = ...
  // Find the RG and RR values in the output
  let rangeKm = NaN,
    rateKmS = NaN;

  for (const line of lines) {
    const rgMatch = line.match(/RG\s*=\s*([-+]?\d+\.?\d*(?:[EeDd][+-]?\d+)?)/);
    const rrMatch = line.match(/RR\s*=\s*([-+]?\d+\.?\d*(?:[EeDd][+-]?\d+)?)/);
    if (rgMatch) rangeKm = parseFloat(rgMatch[1]);
    if (rrMatch) rateKmS = parseFloat(rrMatch[1]);
    if (!isNaN(rangeKm) && !isNaN(rateKmS)) break;
  }

  if (isNaN(rangeKm) || rangeKm <= 0) {
    throw new Error(`Could not parse RG from VECTORS output`);
  }

  const speedKmh = Math.abs(rateKmS) * 3600;

  if (rangeKm > 500000) {
    throw new Error(
      `Implausible range: ${Math.round(rangeKm).toLocaleString()} km`,
    );
  }

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
