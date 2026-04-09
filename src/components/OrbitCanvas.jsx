import { useRef, useEffect, useCallback } from "react";
import { MISSION } from "../data/missionData";

// ── Trajectory waypoints ──────────────────────────────────────────────────────
// Artemis II hybrid free-return trajectory (Earth-centered, 2-D projection)
// [missionFraction, dist_km_from_earth, angle_deg]  (0°=right, 90°=up)
//
// Key calibration points:
//   • Day 8.0 (frac 0.80): JPL Horizons confirmed ~246,000 km, 4,384 km/h
//   • Moon flyby (frac 0.472): far-side pass at ~384,400 km from Earth
//     spacecraft goes BEHIND the Moon → max Earth-distance ~393,400 km
//   • Outbound and return legs track different angles → visible separation
const TRAJECTORY = [
  [0.0, 350, 90], // Launch — LEO parking orbit
  [0.03, 8000, 88], // Post-TLI departure
  [0.115, 57000, 82], // TLI milestone
  [0.25, 165000, 72], // Outbound day 2.5
  [0.38, 295000, 62], // Approaching Moon
  [0.44, 355000, 55], // Entering lunar sphere of influence
  [0.46, 376000, 49], // Final inbound leg
  [0.472, 384400, 44], // ← Moon orbital distance (flyby point)
  [0.49, 393400, 37], // Far-side arc — behind the Moon
  [0.505, 392000, 30], // Continuing far-side arc
  [0.53, 386000, 22], // Departing Moon influence
  [0.57, 368000, 16], // Return coast begins
  [0.65, 330000, 10], // Mid-return day 6.5
  [0.78, 246000, 5], // JPL-confirmed position (day 8)
  [0.87, 155000, 2], // Late return
  [0.94, 45000, 1], // Entry approach
  [1.0, 6500, 0], // Splashdown
];

const MOON_DIST_KM = 384400;
const MOON_ANGLE = 44; // matches TRAJECTORY flyby node at frac 0.472
const DISPLAY_MAX = 440000;
const EARTH_R_KM = 6371;
const MOON_R_KM = 1737;

// ── Catmull-Rom spline ────────────────────────────────────────────────────────
function catmullRom(p0, p1, p2, p3, t) {
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
  );
}

function buildSpline(cx, cy, displayR, n = 280) {
  const pts = TRAJECTORY.map(([, dist, ang]) => {
    const rad = (ang * Math.PI) / 180;
    const d = (dist / DISPLAY_MAX) * displayR;
    return { x: cx + Math.cos(rad) * d, y: cy - Math.sin(rad) * d };
  });
  const points = [];
  for (let i = 0; i < n; i++) {
    const raw = (i / (n - 1)) * (TRAJECTORY.length - 1);
    const idx = Math.floor(raw);
    const t = raw - idx;
    const i0 = Math.max(0, idx - 1);
    const i1 = idx;
    const i2 = Math.min(pts.length - 1, idx + 1);
    const i3 = Math.min(pts.length - 1, idx + 2);
    points.push({
      x: catmullRom(pts[i0].x, pts[i1].x, pts[i2].x, pts[i3].x, t),
      y: catmullRom(pts[i0].y, pts[i1].y, pts[i2].y, pts[i3].y, t),
      frac: i / (n - 1),
    });
  }
  return points;
}

function interpolateTraj(frac) {
  if (frac <= 0) return { dist: TRAJECTORY[0][1] };
  if (frac >= 1) return { dist: TRAJECTORY[TRAJECTORY.length - 1][1] };
  for (let i = 0; i < TRAJECTORY.length - 1; i++) {
    const [t0, d0] = TRAJECTORY[i];
    const [t1, d1] = TRAJECTORY[i + 1];
    if (frac >= t0 && frac <= t1) {
      const tt = (frac - t0) / (t1 - t0);
      return { dist: d0 + (d1 - d0) * tt };
    }
  }
  return { dist: 0 };
}

function ptSegDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax,
    dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 12;
const clampZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

// ── Component ─────────────────────────────────────────────────────────────────
export default function OrbitCanvas({ orionFraction, telemetry }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const s = useRef({
    mouse: null,
    frame: 0,
    spline: [],
    lastW: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    dragging: null,
    pinch: null,
  });

  const { distEarth, speedKmh, isLive } = telemetry || {};

  // ── Core draw ────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = W / 2,
      cy = H / 2;
    const baseR = Math.min(W, H) * 0.44; // world units, zoom=1

    s.current.frame++;
    const frame = s.current.frame;
    const mouse = s.current.mouse;
    const zoom = s.current.zoom;
    const panX = s.current.panX;
    const panY = s.current.panY;
    const displayR = baseR; // spline built at zoom=1; transform handles zoom

    // ── Background ────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.7);
    bg.addColorStop(0, "#001030");
    bg.addColorStop(1, "#000810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── World transform (zoom + pan) ──────────────────────────────────────────
    ctx.save();
    ctx.translate(cx + panX, cy + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // ── Stars ─────────────────────────────────────────────────────────────────
    ctx.save();
    const rng = { v: 42 };
    const lcg = () => {
      rng.v = (rng.v * 1664525 + 1013904223) & 0xffffffff;
      return (rng.v >>> 0) / 0xffffffff;
    };
    for (let i = 0; i < 180; i++) {
      const sx = lcg() * W,
        sy = lcg() * H;
      if (Math.hypot(sx - cx, sy - cy) < displayR * 0.95) continue;
      const alpha =
        0.1 + lcg() * 0.5 + 0.15 * Math.sin(frame * 0.02 + lcg() * 6.28);
      ctx.fillStyle = `rgba(200,220,255,${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, lcg() * 1.4 + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── Polar grid ────────────────────────────────────────────────────────────
    const scale = displayR / DISPLAY_MAX;
    ctx.save();
    ctx.setLineDash([2, 4]);
    [100000, 200000, 300000, 400000].forEach((km) => {
      const r = km * scale;
      ctx.strokeStyle = "rgba(0,120,200,0.12)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      const lx = cx + Math.cos((225 * Math.PI) / 180) * r;
      const ly = cy - Math.sin((225 * Math.PI) / 180) * r;
      ctx.fillStyle = "rgba(0,130,200,0.35)";
      ctx.font = `${Math.max(6, 8 / zoom)}px "JetBrains Mono", monospace`;
      ctx.textAlign = "right";
      ctx.fillText(`${km / 1000}k km`, lx - 4, ly);
    });
    for (let a = 0; a < 360; a += 45) {
      const rad = (a * Math.PI) / 180;
      ctx.strokeStyle = "rgba(0,100,180,0.07)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(rad) * displayR * 1.1,
        cy - Math.sin(rad) * displayR * 1.1,
      );
      ctx.stroke();
    }
    ctx.restore();

    // ── Build/reuse spline ────────────────────────────────────────────────────
    const N = 280;
    if (!s.current.spline.length || s.current.lastW !== W) {
      s.current.spline = buildSpline(cx, cy, displayR, N);
      s.current.lastW = W;
    }
    const spline = s.current.spline;
    const splitIdx = spline.findIndex((p) => p.frac >= orionFraction);
    const split = Math.max(1, splitIdx < 0 ? N - 1 : splitIdx);

    // ── Past trajectory ───────────────────────────────────────────────────────
    if (split > 1) {
      ctx.save();
      const grad = ctx.createLinearGradient(
        spline[0].x,
        spline[0].y,
        spline[split].x,
        spline[split].y,
      );
      grad.addColorStop(0, "rgba(0,100,200,0.15)");
      grad.addColorStop(1, "rgba(0,180,255,0.5)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(spline[0].x, spline[0].y);
      for (let i = 1; i <= split; i++) ctx.lineTo(spline[i].x, spline[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // ── Future trajectory ─────────────────────────────────────────────────────
    if (split < N - 1) {
      ctx.save();
      ctx.strokeStyle = "rgba(0,150,255,0.18)";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([4 / zoom, 6 / zoom]);
      ctx.beginPath();
      ctx.moveTo(spline[split].x, spline[split].y);
      for (let i = split + 1; i < N; i++) ctx.lineTo(spline[i].x, spline[i].y);
      ctx.stroke();
      ctx.restore();
    }

    // ── Moon ──────────────────────────────────────────────────────────────────
    const moonD = (MOON_DIST_KM / DISPLAY_MAX) * displayR;
    const moonRad = (MOON_ANGLE * Math.PI) / 180;
    const mx = cx + Math.cos(moonRad) * moonD;
    const my = cy - Math.sin(moonRad) * moonD;
    const moonPx = Math.max(4, (MOON_R_KM / DISPLAY_MAX) * displayR * 8);
    const moonGlow = ctx.createRadialGradient(mx, my, 0, mx, my, moonPx * 3);
    moonGlow.addColorStop(0, "rgba(180,180,160,0.1)");
    moonGlow.addColorStop(1, "transparent");
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(mx, my, moonPx * 3, 0, Math.PI * 2);
    ctx.fill();
    const moonBody = ctx.createRadialGradient(
      mx - moonPx * 0.3,
      my - moonPx * 0.3,
      0,
      mx,
      my,
      moonPx,
    );
    moonBody.addColorStop(0, "#D0C8BC");
    moonBody.addColorStop(0.6, "#8A8070");
    moonBody.addColorStop(1, "#4A4440");
    ctx.fillStyle = moonBody;
    ctx.beginPath();
    ctx.arc(mx, my, moonPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(180,170,160,0.6)";
    ctx.font = `bold ${Math.max(6, 9 / zoom)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("MOON", mx, my - moonPx - 5 / zoom);
    ctx.fillStyle = "rgba(180,170,160,0.35)";
    ctx.font = `${Math.max(5, 7 / zoom)}px "JetBrains Mono", monospace`;
    ctx.fillText("384,400 km", mx, my - moonPx - 14 / zoom);

    // ── Earth ─────────────────────────────────────────────────────────────────
    const earthPx = Math.max(18, (EARTH_R_KM / DISPLAY_MAX) * displayR * 14);
    for (let r = 3; r >= 0; r--) {
      const atmoGlow = ctx.createRadialGradient(
        cx,
        cy,
        earthPx,
        cx,
        cy,
        earthPx + (r + 1) * 12,
      );
      atmoGlow.addColorStop(0, `rgba(20,100,255,${0.1 - r * 0.02})`);
      atmoGlow.addColorStop(1, "transparent");
      ctx.fillStyle = atmoGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, earthPx + (r + 1) * 12, 0, Math.PI * 2);
      ctx.fill();
    }
    const earthBody = ctx.createRadialGradient(
      cx - earthPx * 0.3,
      cy - earthPx * 0.3,
      0,
      cx,
      cy,
      earthPx,
    );
    earthBody.addColorStop(0, "#2060CC");
    earthBody.addColorStop(0.5, "#0A3080");
    earthBody.addColorStop(1, "#020820");
    ctx.fillStyle = earthBody;
    ctx.beginPath();
    ctx.arc(cx, cy, earthPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, earthPx, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(40,110,50,0.45)";
    ctx.beginPath();
    ctx.ellipse(
      cx - earthPx * 0.3,
      cy - earthPx * 0.2,
      earthPx * 0.18,
      earthPx * 0.22,
      -0.3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + earthPx * 0.1,
      cy - earthPx * 0.15,
      earthPx * 0.1,
      earthPx * 0.28,
      0.1,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(
      cx + earthPx * 0.3,
      cy - earthPx * 0.2,
      earthPx * 0.24,
      earthPx * 0.18,
      0.2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(100,180,255,0.35)";
    ctx.lineWidth = 2 / zoom;
    ctx.beginPath();
    ctx.arc(cx, cy, earthPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(100,180,255,0.55)";
    ctx.font = `bold ${Math.max(6, 9 / zoom)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText("EARTH", cx, cy + earthPx + 12 / zoom);

    // ── Spacecraft ────────────────────────────────────────────────────────────
    const cur = spline[Math.min(split, N - 1)];
    const prev = spline[Math.max(0, Math.min(split - 1, N - 2))];
    const scX = cur.x,
      scY = cur.y;
    const pulseR = (10 + 4 * Math.sin(frame * 0.07)) / zoom;
    const pulseR2 = (14 + 6 * Math.sin(frame * 0.055 + 1)) / zoom;
    const ringAlpha = 0.25 + 0.15 * Math.sin(frame * 0.07);
    ctx.strokeStyle = `rgba(255,96,32,${ringAlpha})`;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.arc(scX, scY, pulseR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,96,32,${ringAlpha * 0.4})`;
    ctx.lineWidth = 0.5 / zoom;
    ctx.beginPath();
    ctx.arc(scX, scY, pulseR2, 0, Math.PI * 2);
    ctx.stroke();
    const coreR = 8 / zoom;
    const scGlow = ctx.createRadialGradient(scX, scY, 0, scX, scY, coreR);
    scGlow.addColorStop(0, "#FF9944");
    scGlow.addColorStop(0.4, "#FF6020");
    scGlow.addColorStop(1, "transparent");
    ctx.fillStyle = scGlow;
    ctx.beginPath();
    ctx.arc(scX, scY, coreR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF8030";
    ctx.beginPath();
    ctx.arc(scX, scY, 4 / zoom, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFD0A0";
    ctx.beginPath();
    ctx.arc(scX, scY, 2 / zoom, 0, Math.PI * 2);
    ctx.fill();
    const vDx = cur.x - prev.x,
      vDy = cur.y - prev.y;
    const vLen = Math.hypot(vDx, vDy) || 1;
    ctx.strokeStyle = "rgba(255,184,0,0.5)";
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([3 / zoom, 3 / zoom]);
    ctx.beginPath();
    ctx.moveTo(scX, scY);
    ctx.lineTo(
      scX + ((vDx / vLen) * 18) / zoom,
      scY + ((vDy / vLen) * 18) / zoom,
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // ── End world transform ───────────────────────────────────────────────────
    ctx.restore();

    // ── Scale bar (screen space — updates with zoom level) ────────────────────
    const kmPerScreenPx = DISPLAY_MAX / (displayR * zoom);
    const barPx = 72;
    const barKmRaw = barPx * kmPerScreenPx;
    const barLabel =
      barKmRaw >= 1000
        ? `${Math.round(barKmRaw / 1000)}k km`
        : `${Math.round(barKmRaw)} km`;
    const bx = 14,
      by = H - 18;
    ctx.strokeStyle = "rgba(0,180,255,0.4)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + barPx, by);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by - 3);
    ctx.lineTo(bx, by + 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx + barPx, by - 3);
    ctx.lineTo(bx + barPx, by + 3);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,160,220,0.4)";
    ctx.font = '7px "JetBrains Mono", monospace';
    ctx.textAlign = "left";
    ctx.fillText(barLabel, bx, by - 6);

    // ── Data source pill ──────────────────────────────────────────────────────
    ctx.fillStyle = isLive ? "rgba(0,232,122,0.12)" : "rgba(255,184,0,0.10)";
    ctx.strokeStyle = isLive ? "rgba(0,232,122,0.3)" : "rgba(255,184,0,0.25)";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    ctx.roundRect(W - 100, H - 22, 90, 14, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isLive ? "rgba(0,232,122,0.7)" : "rgba(255,184,0,0.7)";
    ctx.font = 'bold 7px "JetBrains Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText(isLive ? "● LIVE JPL DATA" : "◌ SIM DATA", W - 55, H - 12);

    // ── Zoom level indicator ──────────────────────────────────────────────────
    if (zoom > 1.05) {
      ctx.fillStyle = "rgba(0,180,255,0.12)";
      ctx.strokeStyle = "rgba(0,180,255,0.3)";
      ctx.lineWidth = 0.8;
      ctx.roundRect(W / 2 - 30, 10, 60, 15, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(100,200,255,0.75)";
      ctx.font = 'bold 7px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(`ZOOM  ${zoom.toFixed(1)}×`, W / 2, 21);
    }

    // ── Hover tooltip (screen space) ──────────────────────────────────────────
    if (mouse) {
      const { mx: hx, my: hy } = mouse;
      // Convert screen → world
      const wMx = cx + (hx - cx - panX) / zoom;
      const wMy = cy + (hy - cy - panY) / zoom;

      let nearestDist = Infinity,
        nearestIdx = -1;
      for (let i = 0; i < spline.length - 1; i++) {
        const d = ptSegDist(
          wMx,
          wMy,
          spline[i].x,
          spline[i].y,
          spline[i + 1].x,
          spline[i + 1].y,
        );
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }

      if (nearestDist < 28 / zoom && nearestIdx >= 0) {
        const np = spline[nearestIdx];
        const nFrac = np.frac;
        const { dist: interpDist } = interpolateTraj(nFrac);
        const launchMs = MISSION.launchTime.getTime();
        const totalMs = MISSION.splashdownTime.getTime() - launchMs;
        const hoverMs = launchMs + nFrac * totalMs;
        const hDate = new Date(hoverMs).toISOString().slice(0, 10);

        // World → screen for tooltip anchor
        const hsx = cx + panX + (np.x - cx) * zoom;
        const hsy = cy + panY + (np.y - cy) * zoom;

        ctx.save();
        ctx.strokeStyle = "rgba(0,220,255,0.65)";
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(hsx - 14, hsy);
        ctx.lineTo(hsx + 14, hsy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hsx, hsy - 14);
        ctx.lineTo(hsx, hsy + 14);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(0,220,255,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(hsx, hsy, 6, 0, Math.PI * 2);
        ctx.stroke();

        const isPast = nFrac <= orionFraction;
        const tlW = 176,
          tlH = 86;
        let tlX = hsx + 14,
          tlY = hsy - tlH / 2;
        if (tlX + tlW > W - 8) tlX = hsx - tlW - 14;
        if (tlY < 8) tlY = 8;
        if (tlY + tlH > H - 8) tlY = H - tlH - 8;

        ctx.fillStyle = "rgba(2,10,26,0.92)";
        ctx.strokeStyle = "rgba(0,180,255,0.35)";
        ctx.lineWidth = 1;
        ctx.roundRect(tlX, tlY, tlW, tlH, 4);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(0,220,255,0.7)";
        ctx.lineWidth = 1.5;
        [
          [tlX, tlY, 1, 1],
          [tlX + tlW, tlY, -1, 1],
          [tlX, tlY + tlH, 1, -1],
          [tlX + tlW, tlY + tlH, -1, -1],
        ].forEach(([bx, by, sx, sy]) => {
          ctx.beginPath();
          ctx.moveTo(bx + sx * 8, by);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx, by + sy * 8);
          ctx.stroke();
        });

        ctx.font = 'bold 8px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(0,200,255,0.5)";
        ctx.textAlign = "left";
        ctx.fillText(
          isPast ? "TRAJECTORY PAST" : "TRAJECTORY AHEAD",
          tlX + 10,
          tlY + 14,
        );
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = "rgba(200,220,255,0.85)";
        ctx.fillText(
          `DIST   ${Math.round(interpDist).toLocaleString()} km`,
          tlX + 10,
          tlY + 30,
        );
        ctx.fillText(`DATE   ${hDate}`, tlX + 10, tlY + 44);
        if (!isPast) {
          const etaMs = hoverMs - Date.now();
          if (etaMs > 0) {
            const etaH = Math.floor(etaMs / 3600000);
            const etaM = Math.floor((etaMs % 3600000) / 60000);
            ctx.fillText(
              `ETA    ${etaH}h ${String(etaM).padStart(2, "0")}m`,
              tlX + 10,
              tlY + 58,
            );
          }
        } else if (speedKmh) {
          ctx.fillText(
            `SPEED  ${Math.round(speedKmh).toLocaleString()} km/h`,
            tlX + 10,
            tlY + 58,
          );
        }
        ctx.font = 'bold 7px "JetBrains Mono", monospace';
        ctx.fillStyle = isPast ? "rgba(0,232,122,0.7)" : "rgba(0,150,255,0.7)";
        ctx.fillText(
          isPast ? "● COMPLETED" : "◌ AHEAD",
          tlX + 10,
          tlY + tlH - 10,
        );
        ctx.restore();
      }
    }
  }, [orionFraction, distEarth, speedKmh, isLive]);

  // ── Animation loop ────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  // ── Canvas sizing (DPR aware) ─────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const size = container.clientWidth;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + "px";
      canvas.style.height = size + "px";
      const ctx = canvas.getContext("2d");
      ctx.scale(dpr, dpr);
      s.current.spline = [];
    };
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    resize();
    return () => ro.disconnect();
  }, []);

  // ── Zoom helper ───────────────────────────────────────────────────────────
  const applyZoom = useCallback((newZoom, focalX, focalY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = W / 2,
      cy = H / 2;
    const clamped = clampZoom(newZoom);
    const ratio = clamped / s.current.zoom;
    s.current.panX = focalX - cx - (focalX - cx - s.current.panX) * ratio;
    s.current.panY = focalY - cy - (focalY - cy - s.current.panY) * ratio;
    s.current.zoom = clamped;
  }, []);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      applyZoom(
        s.current.zoom * factor,
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [applyZoom]);

  // ── Mouse drag (pan) + hover ──────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    s.current.dragging = {
      startX: e.clientX,
      startY: e.clientY,
      panX: s.current.panX,
      panY: s.current.panY,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    s.current.mouse = { mx: e.clientX - rect.left, my: e.clientY - rect.top };
    const d = s.current.dragging;
    if (d) {
      s.current.panX = d.panX + (e.clientX - d.startX);
      s.current.panY = d.panY + (e.clientY - d.startY);
    }
  }, []);

  const stopDrag = useCallback(() => {
    s.current.dragging = null;
  }, []);
  const clearMouse = useCallback(() => {
    s.current.mouse = null;
    s.current.dragging = null;
  }, []);

  // ── Touch pinch + drag ────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const canvas = canvasRef.current;
      const rect = canvas
        ? canvas.getBoundingClientRect()
        : { left: 0, top: 0 };
      s.current.pinch = {
        dist: Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        ),
        zoom: s.current.zoom,
        focalX: (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left,
        focalY: (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top,
      };
    } else if (e.touches.length === 1) {
      s.current.dragging = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        panX: s.current.panX,
        panY: s.current.panY,
      };
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      e.preventDefault();
      if (e.touches.length === 2 && s.current.pinch) {
        const { dist: sd, zoom: sz, focalX, focalY } = s.current.pinch;
        const nd = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        );
        applyZoom(sz * (nd / sd), focalX, focalY);
      } else if (e.touches.length === 1) {
        const d = s.current.dragging;
        if (d) {
          s.current.panX = d.panX + (e.touches[0].clientX - d.startX);
          s.current.panY = d.panY + (e.touches[0].clientY - d.startY);
        }
      }
    },
    [applyZoom],
  );

  const stopTouch = useCallback(() => {
    s.current.dragging = null;
    s.current.pinch = null;
  }, []);

  // ── Button actions ────────────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    applyZoom(
      s.current.zoom * 1.5,
      canvas.width / dpr / 2,
      canvas.height / dpr / 2,
    );
  }, [applyZoom]);

  const zoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    applyZoom(
      s.current.zoom / 1.5,
      canvas.width / dpr / 2,
      canvas.height / dpr / 2,
    );
  }, [applyZoom]);

  const resetView = useCallback(() => {
    s.current.zoom = 1;
    s.current.panX = 0;
    s.current.panY = 0;
  }, []);

  const focusOrion = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    const cx = W / 2,
      cy = H / 2;
    const displayR = Math.min(W, H) * 0.44;
    const spline = s.current.spline;
    if (!spline.length) return;
    const N = spline.length;
    const idx = Math.min(
      Math.max(
        0,
        spline.findIndex((p) => p.frac >= orionFraction),
      ),
      N - 1,
    );
    const pt = spline[idx];
    const targetZoom = 5;
    s.current.zoom = targetZoom;
    s.current.panX = (cx - pt.x) * targetZoom;
    s.current.panY = (cy - pt.y) * targetZoom;
  }, [orionFraction]);

  // Button style — horizontal row edition
  const btnStyle = (highlight, wide) => ({
    width: wide ? 48 : 36,
    height: 32,
    background: highlight ? "rgba(255,96,32,0.20)" : "rgba(2,10,28,0.80)",
    border: `1px solid ${highlight ? "rgba(255,96,32,0.55)" : "rgba(0,160,255,0.25)"}`,
    borderRadius: 6,
    color: highlight ? "#FF9060" : "rgba(140,210,255,0.85)",
    fontSize: highlight ? 17 : 14,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
    userSelect: "none",
    flexShrink: 0,
    boxShadow: highlight
      ? "0 0 10px rgba(255,96,32,0.18)"
      : "0 2px 8px rgba(0,0,0,0.35)",
    transition: "background 0.15s, border-color 0.15s",
    letterSpacing: highlight ? 0 : 0.5,
    fontFamily: '"JetBrains Mono", monospace',
  });

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", aspectRatio: "1", position: "relative" }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={clearMouse}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopTouch}
        style={{
          display: "block",
          borderRadius: "50%",
          cursor: s.current.dragging ? "grabbing" : "crosshair",
          touchAction: "none",
        }}
      />

      {/* ── Zoom controls — horizontal row at bottom-center, inside circle ── */}
      <div
        style={{
          position: "absolute",
          bottom: "11%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          zIndex: 10,
        }}>
        <button
          title="Focus on Orion spacecraft"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={focusOrion}
          style={btnStyle(true, true)}>
          ⊕
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: "rgba(0,150,255,0.2)",
            margin: "0 2px",
          }}
        />

        <button
          title="Zoom in (scroll up)"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={zoomIn}
          style={btnStyle(false)}>
          +
        </button>
        <button
          title="Zoom out (scroll down)"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={zoomOut}
          style={btnStyle(false)}>
          −
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 20,
            background: "rgba(0,150,255,0.2)",
            margin: "0 2px",
          }}
        />

        <button
          title="Reset view"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={resetView}
          style={btnStyle(false)}>
          ↺
        </button>
      </div>

      {/* ── Hint ── */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 7,
          color: "rgba(70,130,190,0.38)",
          letterSpacing: 1.5,
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}>
        SCROLL TO ZOOM · DRAG TO PAN
      </div>
    </div>
  );
}
