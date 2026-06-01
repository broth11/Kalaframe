import { useEffect, useRef } from "react";

// ── Internal coordinate system ────────────────────────────────────────────────
// Left half: x in [0, 800).  Mirrored group reflects everything to [800, 1600].
const W  = 1600;
const H  = 900;
const BG = "#fafaf7";
const INK = "#0a0a0a";

// ── Blob definitions (left half only) ────────────────────────────────────────
// type "ink"  → filled with INK colour
// type "hole" → filled with BG colour, drawn on top to carve negative space
//
// cx, cy  — ellipse centre (left-half coords)
// rx, ry  — semi-axes at rest
// n       — number of points around the ellipse
// spd     — base angular speed (seconds⁻¹)
// wob     — wobble amplitude as a fraction of radius
// phi     — initial phase offset (rad)
const ALL_BLOBS = [
  // ── Ink blobs ──────────────────────────────────────────────────────────────
  // 0  Main body — large central mass, close to fold; the two halves merge here
  { id: 0, type: "ink",  cx: 668, cy: 450, rx: 228, ry: 175, n: 11, spd: 0.14, wob: 0.19, phi: 0.00 },
  // 1  Upper inner wing
  { id: 1, type: "ink",  cx: 570, cy: 235, rx: 145, ry: 113, n: 9,  spd: 0.12, wob: 0.24, phi: 2.10 },
  // 2  Lower inner wing
  { id: 2, type: "ink",  cx: 565, cy: 668, rx: 140, ry: 109, n: 9,  spd: 0.13, wob: 0.23, phi: 4.80 },
  // 3  Outer upper lobe
  { id: 3, type: "ink",  cx: 322, cy: 296, rx: 120, ry: 91,  n: 8,  spd: 0.10, wob: 0.28, phi: 1.40 },
  // 4  Outer lower lobe
  { id: 4, type: "ink",  cx: 335, cy: 611, rx: 112, ry: 87,  n: 8,  spd: 0.11, wob: 0.26, phi: 5.50 },
  // 5  Far satellite dot
  { id: 5, type: "ink",  cx: 135, cy: 443, rx: 60,  ry: 46,  n: 6,  spd: 0.09, wob: 0.32, phi: 3.20 },
  // 6  Inner vertical slot — very close to fold, tall & narrow (active only)
  { id: 6, type: "ink",  cx: 746, cy: 448, rx: 46,  ry: 134, n: 8,  spd: 0.17, wob: 0.17, phi: 6.10 },
  // 7  Extra outer lobe (active only)
  { id: 7, type: "ink",  cx: 212, cy: 308, rx: 74,  ry: 56,  n: 6,  spd: 0.11, wob: 0.30, phi: 0.80 },
  // ── Holes ──────────────────────────────────────────────────────────────────
  // breathSpd drives the open/close cycle independently of edge wobble (spd).
  // Each hole has a different breathSpd and phi so they're out of phase —
  // one may be closing while another is fully open.
  // 8  Internal window inside main body
  { id: 8,  type: "hole", cx: 660, cy: 405, rx: 64,  ry: 74,  n: 7,  spd: 0.08, wob: 0.18, phi: 1.00, breathSpd: 0.85 },
  // 9  Window inside upper wing
  { id: 9,  type: "hole", cx: 624, cy: 190, rx: 36,  ry: 28,  n: 6,  spd: 0.07, wob: 0.20, phi: 3.60, breathSpd: 1.10 },
  // 10 Window inside lower wing (active only)
  { id: 10, type: "hole", cx: 620, cy: 712, rx: 32,  ry: 25,  n: 6,  spd: 0.07, wob: 0.20, phi: 5.90, breathSpd: 0.95 },
];

// Active blob IDs by mode
const MODE_IDS = {
  calm:   new Set([0, 1, 2, 3, 4, 5,           8, 9     ]),
  active: new Set([0, 1, 2, 3, 4, 5, 6, 7,     8, 9, 10 ]),
  exam:   new Set([0, 1, 2,           5,        8        ]),
};

const MODE_PARAMS = {
  calm:   { speedMult: 1.00, wobbleMult: 1.00 },
  active: { speedMult: 1.80, wobbleMult: 1.50 },
  exam:   { speedMult: 0.35, wobbleMult: 0.50 },
};

const INTENSITY_WOBBLE = { low: 0.65, normal: 1.00, high: 1.40 };

// ── Path generation ───────────────────────────────────────────────────────────

function genPoints(blob, t, sm, wm) {
  const pts = [];
  for (let i = 0; i < blob.n; i++) {
    const angle = (Math.PI * 2 * i) / blob.n;
    // Two-frequency wobble on each point's radius for organic feel
    const w =
      1 +
      Math.sin(t * blob.spd * sm + blob.phi + i * 1.73) * blob.wob * wm +
      Math.sin(t * blob.spd * sm * 0.618 + blob.phi * 1.37 + i * 2.31) * blob.wob * wm * 0.5;
    pts.push({
      x: blob.cx + Math.cos(angle) * blob.rx * w,
      y: blob.cy + Math.sin(angle) * blob.ry * w,
    });
  }
  return pts;
}

// Hole breathing: a smooth sine cycle drives a global scale from 0 → open → 0.
// pow(x, 0.4) on the normalised sine keeps the hole open longer and closes it
// quickly — like an eyelid blinking rather than a constant flicker.
// Each hole also has independent per-point edge wobble (spd / wob).
function genHolePoints(hole, t, sm) {
  // Breath cycle: (sin + 1) / 2 maps to [0, 1]; pow curves it to linger open
  const breath = (Math.sin(t * hole.breathSpd * sm + hole.phi) + 1) / 2;
  const scale  = Math.pow(breath, 0.4); // 0 = closed, 1 = fully open

  const pts = [];
  for (let i = 0; i < hole.n; i++) {
    const angle = (Math.PI * 2 * i) / hole.n;
    const edge =
      1 +
      Math.sin(t * hole.spd * sm + hole.phi + i * 1.73) * hole.wob +
      Math.sin(t * hole.spd * sm * 0.618 + hole.phi * 1.37 + i * 2.31) * hole.wob * 0.5;
    pts.push({
      x: hole.cx + Math.cos(angle) * hole.rx * scale * edge,
      y: hole.cy + Math.sin(angle) * hole.ry * scale * edge,
    });
  }
  return pts;
}

// Catmull-Rom closed spline → SVG cubic Bézier path string.
// Standard tension 0.5 gives the Catmull-Rom tangent T_i = 0.5*(P_{i+1} - P_{i-1}),
// which maps to Bézier CP = P_i ± T_i/3, i.e. divide by 6.
function pointsToPath(pts) {
  const n = pts.length;
  if (n < 3) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const p0   = pts[i];
    const p1   = pts[(i + 1) % n];
    const p2   = pts[(i + 2) % n];
    const c1x  = (p0.x + (p1.x - prev.x) / 6).toFixed(1);
    const c1y  = (p0.y + (p1.y - prev.y) / 6).toFixed(1);
    const c2x  = (p1.x - (p2.x - p0.x) / 6).toFixed(1);
    const c2y  = (p1.y - (p2.y - p0.y) / 6).toFixed(1);
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }
  return d + "Z";
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InkblotSvgVisualizer({ mode, reducedMotion, visualIntensity }) {
  // Separate ref maps for left and right path elements, keyed by blob id.
  const refsL    = useRef({});
  const refsR    = useRef({});
  // Stable prop snapshot read inside the RAF loop (avoids restarting the loop).
  const propsRef = useRef({ mode, reducedMotion, visualIntensity });

  useEffect(() => {
    propsRef.current = { mode, reducedMotion, visualIntensity };
  }, [mode, reducedMotion, visualIntensity]);

  // Single RAF loop — started once on mount, torn down on unmount.
  // Switching themes unmounts this component (VisualizerHost uses key={theme}),
  // so the cleanup fires automatically; no duplicate loops can occur.
  useEffect(() => {
    let raf;

    const loop = (ms) => {
      const t  = ms / 1000; // seconds
      const { mode: m, reducedMotion: rm, visualIntensity: vi } = propsRef.current;

      const modeKey = MODE_IDS[m] ? m : "calm";
      const activeIds = MODE_IDS[modeKey];
      const { speedMult, wobbleMult } = MODE_PARAMS[modeKey];
      const sm = rm ? 0.03 : speedMult;
      const wm = wobbleMult * (INTENSITY_WOBBLE[vi] ?? 1.0);

      for (const blob of ALL_BLOBS) {
        const elL = refsL.current[blob.id];
        const elR = refsR.current[blob.id];
        if (!elL || !elR) continue;

        if (!activeIds.has(blob.id)) {
          // Clear inactive blobs without touching them every frame
          if (elL.getAttribute("d") !== "") {
            elL.setAttribute("d", "");
            elR.setAttribute("d", "");
          }
          continue;
        }

        const pts = blob.type === "hole"
          ? genHolePoints(blob, t, sm)
          : genPoints(blob, t, sm, wm);
        const d = pointsToPath(pts);
        elL.setAttribute("d", d);
        elR.setAttribute("d", d); // mirrored group uses same path data
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const inkBlobs  = ALL_BLOBS.filter(b => b.type === "ink");
  const holeBlobs = ALL_BLOBS.filter(b => b.type === "hole");

  return (
    <div className="inkblot-svg-visualizer" aria-hidden="true">
      <svg
        className="inkblot-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
      >
        <rect width={W} height={H} fill={BG} />

        {/* ── Left half ─────────────────────────────────────────────────── */}
        <g>
          {inkBlobs.map(b => (
            <path
              key={`l-ink-${b.id}`}
              fill={INK}
              ref={el => { refsL.current[b.id] = el; }}
            />
          ))}
          {holeBlobs.map(b => (
            <path
              key={`l-hole-${b.id}`}
              fill={BG}
              ref={el => { refsL.current[b.id] = el; }}
            />
          ))}
        </g>

        {/* ── Right half — mirror of left ───────────────────────────────── */}
        {/* translate(W,0) scale(-1,1) reflects x → W - x, achieving bilateral symmetry */}
        <g transform={`translate(${W},0) scale(-1,1)`}>
          {inkBlobs.map(b => (
            <path
              key={`r-ink-${b.id}`}
              fill={INK}
              ref={el => { refsR.current[b.id] = el; }}
            />
          ))}
          {holeBlobs.map(b => (
            <path
              key={`r-hole-${b.id}`}
              fill={BG}
              ref={el => { refsR.current[b.id] = el; }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
