import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";

const WIDTH = 1600;
const HEIGHT = 900;

const PALETTES = {
  calm: [
    ["#3a86ff", "#48cae4", "#2ec4b6", "#6a4cff"],
    ["#90e0ef", "#48cae4", "#00b4d8", "#5e60ce"],
  ],
  active: [
    ["#ff006e", "#ff6b35", "#ffbe0b", "#06d6a0", "#118ab2"],
    ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
    ["#ff595e", "#ffca3a", "#8ac926", "#1982c4"],
    ["#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
  ],
  exam: [
    ["#adb5bd", "#6c757d", "#495057", "#343a40"],
    ["#ced4da", "#adb5bd", "#6c757d"],
  ],
};

const PRESETS = {
  calm: {
    background: "#f5f5f5",
    bandZones: [
      [-0.04, 0.3],
      [0.18, 0.56],
      [0.45, 0.8],
      [0.68, 1.04],
    ],
    count: [2, 4],
    speed: [0.28, 0.62],
    fade: [0.5, 0.9],
    baseY: [150, 255],
    maxLength: [230, 620],
  },
  active: {
    background: "#ffffff",
    bandZones: [
      [-0.05, 0.17],
      [0.07, 0.32],
      [0.22, 0.46],
      [0.38, 0.65],
      [0.55, 0.8],
      [0.7, 1.05],
    ],
    count: [3, 5],
    speed: [0.62, 1.28],
    fade: [1.1, 1.9],
    baseY: [140, 245],
    maxLength: [270, 760],
  },
  exam: {
    background: "#f0f0f0",
    bandZones: [
      [-0.03, 0.3],
      [0.2, 0.58],
      [0.48, 0.84],
      [0.74, 1.03],
    ],
    count: [2, 4],
    speed: [0.18, 0.38],
    fade: [0.35, 0.65],
    baseY: [160, 255],
    maxLength: [180, 540],
  },
};

const INTENSITY = {
  low: { count: -1, speed: 0.75, length: 0.82 },
  normal: { count: 0, speed: 1, length: 1 },
  high: { count: 1, speed: 1.22, length: 1.08 },
};

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function assignType(index) {
  const r = Math.random();
  if (index === 0 && r < 0.5) return "hero";
  if (r < 0.16) return "curtain";
  if (r < 0.34) return "tendril";
  if (r < 0.5) return "nub";
  if (r < 0.62) return "merged";
  if (r < 0.76) return "hero";
  return "medium";
}

function typeSettings(type) {
  return {
    curtain: { width: 1.65, bulb: 0.72, length: 0.68, wobble: 0.45, speed: 0.78 },
    medium: { width: 1, bulb: 1, length: 1, wobble: 0.7, speed: 1 },
    tendril: { width: 0.42, bulb: 0.42, length: 1.08, wobble: 0.95, speed: 1.08 },
    hero: { width: 1.28, bulb: 1.35, length: 1.28, wobble: 1.25, speed: 0.9 },
    nub: { width: 1.08, bulb: 0.9, length: 0.34, wobble: 0.35, speed: 0.65 },
    merged: { width: 1.55, bulb: 1.05, length: 0.86, wobble: 0.55, speed: 0.82 },
  }[type] ?? typeSettings("medium");
}

function resolvePreset(mode, visualIntensity) {
  return {
    ...(PRESETS[mode] ?? PRESETS.active),
    palette: choose(PALETTES[mode] ?? PALETTES.active),
    intensity: INTENSITY[mode === "exam" ? "low" : visualIntensity] ?? INTENSITY.normal,
  };
}

function createColumn(band, preset, index, clusterCenters) {
  const type = assignType(index);
  const settings = typeSettings(type);
  const cluster = choose(clusterCenters);
  const clustered = Math.random() < 0.72;
  const x = clustered
    ? clamp(cluster + randomRange(-band.width * 0.11, band.width * 0.11), band.left + 24, band.right - 24)
    : randomRange(band.left + 24, band.right - 24);
  const maxLength = randomRange(...preset.maxLength) * preset.intensity.length * settings.length;
  const width = randomRange(10, 34) * settings.width;
  const initial = clamp(randomRange(40, maxLength * 0.82), 18, maxLength);

  return {
    id: `${band.id}-column-${index}`,
    type,
    x,
    width,
    neckWidth: width * randomRange(0.42, 0.64),
    bulbRadius: width * randomRange(1.28, 2.2) * settings.bulb,
    maxLength: clamp(maxLength, 90, HEIGHT * 0.94),
    length: initial,
    archDepth: randomRange(10, type === "merged" ? 22 : 54),
    phase: "growing",
    alpha: randomRange(0.78, 1),
    speed: randomRange(...preset.speed) * preset.intensity.speed * settings.speed,
    fadeRate: randomRange(...preset.fade) / 255,
    wait: 0,
    wobble: randomRange(3, type === "hero" ? 24 : 13) * settings.wobble,
    wobblePhase: randomRange(0, Math.PI * 2),
    wobbleFrequency: randomRange(1.1, 2.4),
    seed: randomRange(0, 1000),
    residue: Math.random() < 0.56,
  };
}

function createBands(mode, visualIntensity) {
  const preset = resolvePreset(mode, visualIntensity);
  return preset.bandZones.map(([zoneLeft, zoneRight], index) => {
    const jitter = randomRange(-0.025, 0.025);
    const left = (zoneLeft + jitter) * WIDTH;
    const right = (zoneRight + jitter * 0.55 + randomRange(-0.018, 0.018)) * WIDTH;
    const band = {
      id: `facemelt-band-${index}`,
      left,
      right,
      width: right - left,
      baseY: randomRange(...preset.baseY),
      reservoirDepth: randomRange(26, 88),
      color: preset.palette[index % preset.palette.length],
      alpha: 0.93,
      seed: randomRange(0, 1000),
      background: preset.background,
      columns: [],
    };
    const clusterCount = Math.floor(randomRange(1, 4));
    const clusters = Array.from({ length: clusterCount }, () => randomRange(left + 28, right - 28));
    const target = Math.max(2, Math.floor(randomRange(...preset.count) + preset.intensity.count));
    band.columns = Array.from({ length: target }, (_, columnIndex) =>
      createColumn(band, preset, columnIndex, clusters),
    ).sort((a, b) => a.x - b.x);
    return band;
  });
}

function reservoirYAt(band, x, time) {
  const normalized = (x - band.left) / band.width;
  const wave =
    Math.sin(normalized * Math.PI * 2.2 + band.seed) * band.reservoirDepth * 0.16 +
    Math.sin(normalized * Math.PI * 5.1 + band.seed * 0.7 + time * 0.18) * band.reservoirDepth * 0.08;
  let sag = wave;
  for (const column of band.columns) {
    const distance = Math.abs(x - column.x);
    const influence = Math.max(0, 1 - distance / (column.width * 5.8));
    sag += influence * band.reservoirDepth * (column.type === "hero" ? 0.72 : 0.42);
  }
  return band.baseY + sag;
}

function centerXAt(column, u, time) {
  return (
    column.x +
    Math.sin(u * Math.PI * column.wobbleFrequency + column.wobblePhase) * column.wobble +
    Math.sin(time * 0.36 + column.seed + u * 2.4) * column.wobble * 0.18
  );
}

function halfWidthAt(column, u) {
  if (column.type === "tendril") {
    if (u < 0.14) return column.width * (1.05 - u * 4.2);
    if (u < 0.82) return column.width * 0.34;
    if (u < 0.96) return column.width * 0.34 + (column.bulbRadius * 0.55 - column.width * 0.34) * ((u - 0.82) / 0.14);
    return column.bulbRadius * 0.34;
  }

  if (column.type === "curtain" || column.type === "merged") {
    if (u < 0.18) return column.width * (1.55 - u * 3.9);
    if (u < 0.82) return column.width * (0.75 + Math.sin(u * Math.PI * 2) * 0.08);
    if (u < 0.96) return column.width * 0.82 + (column.bulbRadius * 0.72 - column.width * 0.82) * ((u - 0.82) / 0.14);
    return Math.max(column.width * 0.56, column.bulbRadius * 0.48);
  }

  if (u < 0.12) return column.width * (1.6 - u * 6.2);
  if (u < 0.72) return column.neckWidth;
  if (u < 0.88) return column.neckWidth + (column.bulbRadius - column.neckWidth) * ((u - 0.72) / 0.16);
  if (u < 0.98) return column.bulbRadius - (column.bulbRadius * 0.42) * ((u - 0.88) / 0.1);
  return column.bulbRadius * 0.5;
}

function dripSidePoint(column, startY, u, side, time) {
  const sign = side === "left" ? -1 : 1;
  return {
    x: centerXAt(column, u, time) + sign * halfWidthAt(column, u),
    y: startY + column.length * u,
  };
}

function archTo(leftX, rightX, leftY, rightY, depth, shallow = false) {
  const gap = rightX - leftX;
  const baseY = Math.max(leftY, rightY);
  const archY = baseY - depth * (shallow ? 0.3 : 1);
  return ` C ${leftX + gap * 0.32} ${archY}, ${rightX - gap * 0.36} ${archY}, ${rightX} ${rightY}`;
}

function buildDripPath(column, startY, time) {
  const topLeft = dripSidePoint(column, startY, 0, "left", time);
  const u1 = 0.18;
  const u2 = 0.72;
  const u3 = 0.88;
  const l1 = dripSidePoint(column, startY, u1, "left", time);
  const l2 = dripSidePoint(column, startY, u2, "left", time);
  const l3 = dripSidePoint(column, startY, u3, "left", time);
  const tip = { x: centerXAt(column, 1, time), y: startY + column.length };
  const r3 = dripSidePoint(column, startY, u3, "right", time);
  const r2 = dripSidePoint(column, startY, u2, "right", time);
  const r1 = dripSidePoint(column, startY, u1, "right", time);
  const topRight = dripSidePoint(column, startY, 0, "right", time);

  return [
    `L ${topLeft.x} ${topLeft.y}`,
    `C ${topLeft.x} ${startY + column.length * 0.08}, ${l1.x} ${l1.y}, ${l1.x} ${l1.y}`,
    `C ${l1.x} ${l1.y}, ${l2.x} ${l2.y}, ${l3.x} ${l3.y}`,
    `C ${l3.x} ${l3.y}, ${tip.x - column.bulbRadius * 0.95} ${tip.y - column.bulbRadius * 0.18}, ${tip.x} ${tip.y}`,
    `C ${tip.x + column.bulbRadius * 0.95} ${tip.y - column.bulbRadius * 0.18}, ${r3.x} ${r3.y}, ${r3.x} ${r3.y}`,
    `C ${r3.x} ${r3.y}, ${r2.x} ${r2.y}, ${r1.x} ${r1.y}`,
    `C ${r1.x} ${r1.y}, ${topRight.x} ${startY + column.length * 0.08}, ${topRight.x} ${topRight.y}`,
  ].join(" ");
}

function buildBandPath(band, time) {
  const visibleColumns = band.columns.filter((column) => column.alpha > 0.02).sort((a, b) => a.x - b.x);
  let d = `M ${band.left} 0 L ${band.right} 0 L ${band.right} ${reservoirYAt(band, band.right, time)}`;

  let cursorX = band.right;
  for (let i = visibleColumns.length - 1; i >= 0; i -= 1) {
    const column = visibleColumns[i];
    const leftAttach = clamp(column.x - column.width * 0.92, band.left, band.right);
    const rightAttach = clamp(column.x + column.width * 0.92, band.left, band.right);
    const rightY = reservoirYAt(band, rightAttach, time);
    const cursorY = reservoirYAt(band, cursorX, time);
    const shallow =
      i < visibleColumns.length - 1 &&
      (visibleColumns[i + 1].type === "merged" || column.type === "merged");

    d += archTo(rightAttach, cursorX, rightY, cursorY, column.archDepth, shallow);
    d += buildDripPath(column, reservoirYAt(band, column.x, time), time);

    const leftY = reservoirYAt(band, leftAttach, time);
    d += ` L ${leftAttach} ${leftY}`;
    cursorX = leftAttach;
  }

  d += archTo(band.left, cursorX, reservoirYAt(band, band.left, time), reservoirYAt(band, cursorX, time), 22, true);
  d += " Z";
  return d;
}

function buildColumnMaskPath(column, time) {
  const startY = reservoirYAt(column.band, column.x, time);
  return `M ${dripSidePoint(column, startY, 0, "left", time).x} ${startY} ${buildDripPath(column, startY, time)} Z`;
}

function updateColumn(column, preset) {
  if (column.phase === "growing") {
    column.length += column.speed;
    if (column.length >= column.maxLength) {
      column.phase = "fading";
    }
  } else if (column.phase === "fading") {
    column.alpha = Math.max(0, column.alpha - column.fadeRate);
    if (column.alpha <= 0.02) {
      column.phase = "waiting";
      column.wait = Math.floor(randomRange(20, 90));
    }
  } else if (column.phase === "waiting") {
    column.wait -= 1;
    if (column.wait <= 0) {
      const settings = typeSettings(column.type);
      column.length = randomRange(24, 90);
      column.maxLength = clamp(randomRange(...preset.maxLength) * preset.intensity.length * settings.length, 90, HEIGHT * 0.94);
      column.speed = randomRange(...preset.speed) * preset.intensity.speed * settings.speed;
      column.fadeRate = randomRange(...preset.fade) / 255;
      column.alpha = 1;
      column.phase = "growing";
    }
  }
}

export function FacemeltSvgVisualizer({ mode, visualIntensity }) {
  const bands = useMemo(() => createBands(mode, visualIntensity), [mode, visualIntensity]);
  const pathRefs = useRef([]);
  const fadeRefs = useRef([]);

  useEffect(() => {
    let frame = 0;
    const preset = resolvePreset(mode, visualIntensity);
    const tick = () => {
      frame += 1;
      const time = frame / 60;
      bands.forEach((band, bandIndex) => {
        band.columns.forEach((column) => updateColumn(column, preset));
        pathRefs.current[bandIndex]?.setAttribute("d", buildBandPath(band, time));
        const fadeGroup = fadeRefs.current[bandIndex];
        if (fadeGroup) {
          fadeGroup.innerHTML = "";
          band.columns
            .filter((column) => column.phase === "fading" && column.alpha < 0.75)
            .forEach((column) => {
              const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
              path.setAttribute("d", buildColumnMaskPath(column, time));
              path.setAttribute("fill", band.background);
              path.setAttribute("opacity", String(1 - column.alpha));
              fadeGroup.appendChild(path);
            });
        }
      });
    };

    gsap.ticker.add(tick);
    tick();

    return () => {
      gsap.ticker.remove(tick);
    };
  }, [bands, mode, visualIntensity]);

  const background = (PRESETS[mode] ?? PRESETS.active).background;

  return (
    <div className="facemelt-svg-visualizer" aria-hidden="true">
      <svg
        className="facemelt-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
      >
        <rect width={WIDTH} height={HEIGHT} fill={background} />
        <defs>
          <filter id="facemelt-soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="10" stdDeviation="8" floodOpacity="0.12" />
          </filter>
        </defs>
        {bands.map((band, index) => (
          <g key={band.id}>
            <path
              ref={(node) => {
                pathRefs.current[index] = node;
              }}
              d={buildBandPath(band, 0)}
              fill={band.color}
              opacity={band.alpha}
              filter="url(#facemelt-soft-shadow)"
            />
            <g
              ref={(node) => {
                fadeRefs.current[index] = node;
              }}
            />
            {band.columns
              .filter((column) => column.type === "hero" || column.type === "medium")
              .slice(0, 2)
              .map((column) => (
                <path
                  key={`${column.id}-highlight`}
                  d={`M ${column.x - column.width * 0.28} ${reservoirYAt(band, column.x, 0) + 30}
                    C ${column.x - column.width * 0.55} ${reservoirYAt(band, column.x, 0) + column.length * 0.28},
                      ${column.x - column.width * 0.22} ${reservoirYAt(band, column.x, 0) + column.length * 0.55},
                      ${column.x - column.width * 0.38} ${reservoirYAt(band, column.x, 0) + column.length * 0.75}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.28)"
                  strokeWidth={Math.max(3, column.width * 0.12)}
                  strokeLinecap="round"
                />
              ))}
            {band.columns
              .filter((column) => column.type === "hero" && column.residue)
              .slice(0, 1)
              .map((column) => (
                <circle
                  key={`${column.id}-satellite`}
                  cx={column.x + Math.sin(column.seed) * column.width}
                  cy={reservoirYAt(band, column.x, 0) + column.length + column.bulbRadius * 1.8}
                  r={Math.max(5, column.width * 0.22)}
                  fill={band.color}
                  opacity="0.32"
                />
              ))}
          </g>
        ))}
      </svg>
    </div>
  );
}
