import { useCallback } from "react";
import { useP5Sketch } from "./useP5Sketch.js";

const FACEMELT_PRESETS = {
  calm: {
    background: "#f5f5f5",
    palettes: [
      ["#3a86ff", "#48cae4", "#2ec4b6", "#6a4cff"],
      ["#90e0ef", "#48cae4", "#00b4d8", "#5e60ce"],
    ],
    dripCountPerBand: [2, 4],
    growRate: [0.08, 0.18],
    fadeRate: [0.4, 0.8],
    baseYRatio: [0.18, 0.28],
    maxLengthRatio: [0.25, 0.7],
    bands: [
      { left: -0.03, right: 0.28 },
      { left: 0.18, right: 0.55 },
      { left: 0.45, right: 0.78 },
      { left: 0.68, right: 1.03 },
    ],
  },
  active: {
    background: "#ffffff",
    palettes: [
      ["#ff006e", "#ff6b35", "#ffbe0b", "#06d6a0", "#118ab2"],
      ["#f72585", "#7209b7", "#3a0ca3", "#4cc9f0"],
      ["#ff595e", "#ffca3a", "#8ac926", "#1982c4"],
      ["#fb5607", "#ffbe0b", "#8338ec", "#3a86ff"],
    ],
    dripCountPerBand: [3, 5],
    growRate: [0.15, 0.35],
    fadeRate: [1, 1.8],
    baseYRatio: [0.16, 0.26],
    maxLengthRatio: [0.3, 0.82],
    bands: [
      { left: -0.04, right: 0.16 },
      { left: 0.08, right: 0.31 },
      { left: 0.22, right: 0.44 },
      { left: 0.38, right: 0.63 },
      { left: 0.55, right: 0.78 },
      { left: 0.7, right: 1.04 },
    ],
  },
  exam: {
    background: "#f0f0f0",
    palettes: [
      ["#adb5bd", "#6c757d", "#495057", "#343a40"],
      ["#ced4da", "#adb5bd", "#6c757d"],
    ],
    dripCountPerBand: [2, 4],
    growRate: [0.04, 0.1],
    fadeRate: [0.25, 0.5],
    baseYRatio: [0.18, 0.28],
    maxLengthRatio: [0.2, 0.6],
    bands: [
      { left: -0.02, right: 0.3 },
      { left: 0.2, right: 0.58 },
      { left: 0.48, right: 0.84 },
      { left: 0.74, right: 1.02 },
    ],
  },
};

const INTENSITY_MULTIPLIERS = {
  low: { count: -1, grow: 0.72, maxLength: 0.82 },
  normal: { count: 0, grow: 1, maxLength: 1 },
  high: { count: 1, grow: 1.22, maxLength: 1.08 },
};

const U_SAMPLES = [
  0, 0.025, 0.05, 0.075, 0.1, 0.12, 0.15, 0.2, 0.28, 0.36, 0.44, 0.52,
  0.6, 0.68, 0.76, 0.82, 0.86, 0.9, 0.93, 0.96, 0.98, 1,
];

function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomRange(p, range) {
  return p.random(range[0], range[1]);
}

function choosePalette(p, preset) {
  return p.random(preset.palettes);
}

function sampleCubicBezier(start, cp1, cp2, end, steps) {
  const points = [];

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const mt = 1 - t;
    points.push({
      x:
        mt ** 3 * start.x +
        3 * mt ** 2 * t * cp1.x +
        3 * mt * t ** 2 * cp2.x +
        t ** 3 * end.x,
      y:
        mt ** 3 * start.y +
        3 * mt ** 2 * t * cp1.y +
        3 * mt * t ** 2 * cp2.y +
        t ** 3 * end.y,
    });
  }

  return points;
}

function smoothPoints(points, passes = 2) {
  let current = points;

  for (let pass = 0; pass < passes; pass += 1) {
    if (current.length < 3) return current;

    const next = [current[0]];
    for (let i = 0; i < current.length - 1; i += 1) {
      const a = current[i];
      const b = current[i + 1];
      next.push({
        x: a.x * 0.75 + b.x * 0.25,
        y: a.y * 0.75 + b.y * 0.25,
      });
      next.push({
        x: a.x * 0.25 + b.x * 0.75,
        y: a.y * 0.25 + b.y * 0.75,
      });
    }
    next.push(current[current.length - 1]);
    current = next;
  }

  return current;
}

function assignColumnType(p, index) {
  const r = p.random();
  if (index === 0 && r < 0.55) return "hero";
  if (r < 0.16) return "curtain";
  if (r < 0.34) return "tendril";
  if (r < 0.5) return "nub";
  if (r < 0.62) return "merged";
  if (r < 0.76) return "hero";
  return "medium";
}

function getColumnTypeSettings(type) {
  const settings = {
    curtain: { width: 1.7, bulge: 0.72, maxLength: 0.68, wobble: 0.48, grow: 0.78 },
    medium: { width: 1, bulge: 1, maxLength: 1, wobble: 0.75, grow: 1 },
    tendril: { width: 0.42, bulge: 0.38, maxLength: 1.08, wobble: 0.9, grow: 1.08 },
    hero: { width: 1.25, bulge: 1.35, maxLength: 1.28, wobble: 1.25, grow: 0.9 },
    nub: { width: 1.1, bulge: 0.9, maxLength: 0.34, wobble: 0.35, grow: 0.65 },
    merged: { width: 1.55, bulge: 1.05, maxLength: 0.88, wobble: 0.58, grow: 0.82 },
  };
  return settings[type] ?? settings.medium;
}

function dripHalfWidth(p, u, dripWidth, bulgeRadius, type) {
  const typeSettings = getColumnTypeSettings(type);
  if (type === "tendril") {
    if (u < 0.14) return p.map(u, 0, 0.14, dripWidth * 1.05, dripWidth * 0.46);
    if (u < 0.82) return dripWidth * 0.34;
    if (u < 0.96) {
      const t = (u - 0.82) / 0.14;
      return dripWidth * 0.36 + (bulgeRadius * 0.55 - dripWidth * 0.36) * (1 - Math.cos(t * Math.PI)) * 0.5;
    }
    return bulgeRadius * 0.34;
  }

  if (type === "curtain" || type === "merged") {
    if (u < 0.18) return p.map(u, 0, 0.18, dripWidth * 1.55, dripWidth * 0.82);
    if (u < 0.82) return dripWidth * p.map(Math.sin(u * Math.PI * 2), -1, 1, 0.68, 0.9);
    if (u < 0.96) {
      const t = (u - 0.82) / 0.14;
      return dripWidth * 0.82 + (bulgeRadius * 0.72 - dripWidth * 0.82) * (1 - Math.cos(t * Math.PI)) * 0.5;
    }
    return Math.max(dripWidth * 0.56, bulgeRadius * 0.48);
  }

  if (u < 0.12) {
    return p.map(u, 0, 0.12, dripWidth * 1.8, dripWidth * 0.9);
  }

  if (u < 0.15) {
    return p.map(u, 0.12, 0.15, dripWidth * 0.9, dripWidth * 0.5);
  }

  if (u < 0.78) {
    return dripWidth * p.map(Math.sin(u * Math.PI * 4), -1, 1, 0.46, 0.58) * typeSettings.width;
  }

  if (u < 0.9) {
    const t = (u - 0.78) / 0.12;
    return dripWidth * 0.55 + (bulgeRadius * typeSettings.bulge - dripWidth * 0.55) * (1 - Math.cos(t * Math.PI)) * 0.5;
  }

  if (u < 1) {
    const t = (u - 0.9) / 0.1;
    return bulgeRadius * typeSettings.bulge * (1 - t * t * 0.5);
  }

  return bulgeRadius * typeSettings.bulge * 0.48;
}

function createFacemeltPreset(mode, visualIntensity) {
  const basePreset = FACEMELT_PRESETS[mode] ?? FACEMELT_PRESETS.active;
  const intensity =
    INTENSITY_MULTIPLIERS[mode === "exam" ? "low" : visualIntensity] ??
    INTENSITY_MULTIPLIERS.normal;

  return {
    ...basePreset,
    intensity,
    palette: basePreset.palette ?? basePreset.palettes[0],
  };
}

function createColumn(p, band, preset, intensity, index) {
  const type = assignColumnType(p, index);
  const typeSettings = getColumnTypeSettings(type);
  const maxLength =
    randomRange(p, preset.maxLengthRatio) * p.height * intensity.maxLength *
    typeSettings.maxLength *
    (type === "hero" || p.random() < 0.1 ? p.random(1.12, 1.32) : 1);
  const dripWidth = p.random(8, 32) * typeSettings.width;
  const r = p.random();
  let dripLength;

  if (r < 0.4) {
    dripLength = p.random(0.1, 0.35) * p.height;
  } else if (r < 0.8) {
    dripLength = p.random(0.3, 0.65) * p.height;
  } else {
    dripLength = p.random(0.02, 0.12) * p.height;
  }

  return {
    x: 0,
    type,
    dripLength: clamp(dripLength, 8, maxLength),
    dripWidth,
    bulgeRadius: dripWidth * p.random(1.45, 2.35) * typeSettings.bulge,
    archDepth: p.random(4, type === "merged" ? 14 : 30),
    phase: "growing",
    alpha: p.random(185, 255),
    growRate: randomRange(p, preset.growRate) * intensity.grow * typeSettings.grow,
    maxLength: clamp(maxLength, p.height * 0.12, p.height * 0.92),
    fadeRate: randomRange(p, preset.fadeRate),
    waitFrames: 0,
    seed: p.random(1000),
    wobbleSeed: p.random(1000),
    wobbleAmplitude: p.random(2, type === "hero" ? 14 : 8) * typeSettings.wobble,
    wobbleFrequency: p.random(1.05, 2.2),
    trailAlpha: p.random(8, 22),
    residue: p.random() < 0.55,
    index,
    band,
  };
}

function createReservoirEdge(p, band) {
  const points = [];
  const steps = 36;
  const heavyColumns = band.columns ?? [];

  for (let i = 0; i <= steps; i += 1) {
    const x = p.map(i, 0, steps, band.bandLeft, band.bandRight);
    const nx = i * 0.12;
    let y =
      band.bandBaseY +
      p.map(p.noise(band.edgeNoiseSeed, nx), 0, 1, -band.reservoirDepth * 0.42, band.reservoirDepth * 0.58);

    for (const column of heavyColumns) {
      const distance = Math.abs(x - column.x);
      const influence = Math.max(0, 1 - distance / (column.dripWidth * 5.5));
      y += influence * band.reservoirDepth * (column.type === "hero" ? 0.75 : 0.42);
    }

    points.push({ x, y });
  }

  return smoothPoints(points, 1);
}

function getReservoirYAt(band, x) {
  const points = band.reservoirEdgePoints;
  if (!points?.length) return band.bandBaseY;
  if (x <= points[0].x) return points[0].y;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    if (x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y * (1 - t) + b.y * t;
    }
  }

  return points[points.length - 1].y;
}

function createClusteredColumnsForBand(p, band, preset, intensity) {
  const targetCount = Math.max(
    2,
    Math.floor(randomRange(p, preset.dripCountPerBand) + intensity.count),
  );
  const columns = [];
  const left = band.bandLeft + 18;
  const right = band.bandRight - 18;
  const minSpacing = Math.max(26, (right - left) / (targetCount + 1) * 0.58);
  const clusterCount = Math.floor(p.random(1, 4));
  const clusters = Array.from({ length: clusterCount }, () => p.random(left, right));
  let attempts = 0;

  while (columns.length < targetCount && attempts < 160) {
    attempts += 1;
    const column = createColumn(p, band, preset, intensity, columns.length);
    const cluster = p.random(clusters);
    column.x =
      p.random() < 0.7
        ? clamp(cluster + p.randomGaussian(0, (right - left) * 0.09), left, right)
        : p.random(left, right);

    if (columns.every((existing) => Math.abs(existing.x - column.x) >= minSpacing)) {
      columns.push(column);
    }
  }

  while (columns.length < targetCount) {
    const column = createColumn(p, band, preset, intensity, columns.length);
    column.x = p.map(columns.length + 1, 0, targetCount + 1, left, right);
    columns.push(column);
  }

  return columns.sort((a, b) => a.x - b.x);
}

function createBands(p, preset) {
  const palette = choosePalette(p, preset);
  return preset.bands.map((zone, index) => {
    const jitter = p.random(-0.025, 0.025);
    const bandLeft = (zone.left + jitter) * p.width;
    const bandRight = (zone.right + jitter * 0.55 + p.random(-0.018, 0.018)) * p.width;
    const bandBaseY = randomRange(p, preset.baseYRatio) * p.height;
    const band = {
      bandLeft,
      bandRight,
      bandBaseY,
      color: palette[index % palette.length],
      background: preset.background,
      alpha: 236,
      waveSeed: p.random(1000),
      edgeNoiseSeed: p.random(1000),
      reservoirDepth: p.random(14, 52),
      reservoirEdgePoints: [],
      columns: [],
    };

    band.columns = createClusteredColumnsForBand(p, band, preset, preset.intensity);
    band.reservoirEdgePoints = createReservoirEdge(p, band);
    return band;
  });
}

function updateColumn(p, column, preset) {
  if (column.phase === "growing") {
    const pause = p.noise(column.seed, p.frameCount * 0.01) < 0.12 ? 0.18 : 1;
    column.dripLength += column.growRate * pause;

    if (column.dripLength >= column.maxLength) {
      column.phase = "fading";
    }
  } else if (column.phase === "fading") {
    column.alpha = Math.max(0, column.alpha - column.fadeRate);

    if (column.alpha <= 3) {
      column.phase = "waiting";
      column.waitFrames = Math.floor(p.random(18, 90));
    }
  } else if (column.phase === "waiting") {
    column.waitFrames -= 1;

    if (column.waitFrames <= 0) {
      const maxLength = randomRange(p, preset.maxLengthRatio) * p.height * preset.intensity.maxLength;
      column.dripLength = p.random(0.02, 0.12) * p.height;
      column.maxLength = clamp(maxLength, p.height * 0.12, p.height * 0.92);
      column.growRate = randomRange(p, preset.growRate) * preset.intensity.grow;
      column.fadeRate = randomRange(p, preset.fadeRate);
      column.alpha = 255;
      column.phase = "growing";
    }
  }
}

function buildDripPoints(p, column, startY, side) {
  const visibleLength = Math.max(4, column.dripLength);
  const points = [];
  const sign = side === "left" ? -1 : 1;

  for (const u of U_SAMPLES) {
    const centerWobble =
      Math.sin(u * Math.PI * column.wobbleFrequency + column.wobbleSeed) *
        column.wobbleAmplitude +
      (p.noise(column.wobbleSeed, u * 2) - 0.5) * column.wobbleAmplitude * 0.45;
    const edgeWobble =
      (p.noise(column.seed + u * 3.2, p.frameCount * 0.002) - 0.5) *
      column.dripWidth *
      0.055;
    const halfWidth = dripHalfWidth(p, u, column.dripWidth, column.bulgeRadius, column.type);
    points.push({
      x: column.x + centerWobble + sign * halfWidth + edgeWobble,
      y: startY + visibleLength * u,
    });
  }

  return side === "left" ? points : points.reverse();
}

function buildArchPoints(p, band, startX, endX, archDepth, shallow = false) {
  const gap = endX - startX;
  if (gap <= 4) return [];

  const startY = getReservoirYAt(band, startX);
  const endY = getReservoirYAt(band, endX);
  const baseY = Math.max(startY, endY);
  const depth = shallow ? archDepth * 0.28 : archDepth;
  const archY = baseY - depth;
  const leftBias = p.random(0.24, 0.44);
  const rightBias = p.random(0.56, 0.76);
  return sampleCubicBezier(
    { x: startX, y: startY },
    { x: startX + gap * leftBias, y: archY },
    { x: startX + gap * rightBias, y: archY },
    { x: endX, y: endY },
    28,
  );
}

function buildBottomEdgePoints(p, band) {
  const visibleColumns = band.columns
    .filter((column) => column.alpha > 3)
    .sort((a, b) => a.x - b.x);
  const points = [{ x: band.bandLeft, y: getReservoirYAt(band, band.bandLeft) }];

  if (visibleColumns.length === 0) {
    points.push(...band.reservoirEdgePoints.slice(1));
    return points;
  }

  visibleColumns.forEach((column, index) => {
    const leftAttach = clamp(column.x - column.dripWidth * 0.9, band.bandLeft, band.bandRight);
    const rightAttach = clamp(column.x + column.dripWidth * 0.9, band.bandLeft, band.bandRight);
    const previous = visibleColumns[index - 1];

    const startY = getReservoirYAt(band, column.x);
    if (previous) {
      const startX = clamp(previous.x + previous.dripWidth * 0.9, band.bandLeft, band.bandRight);
      const shallowMerge =
        Math.abs(column.x - previous.x) < (column.dripWidth + previous.dripWidth) * 2.8 ||
        column.type === "merged" ||
        previous.type === "merged";
      points.push(...buildArchPoints(p, band, startX, leftAttach, Math.max(previous.archDepth, column.archDepth), shallowMerge));
    } else {
      points.push(...buildArchPoints(p, band, band.bandLeft, leftAttach, column.archDepth, false));
    }

    points.push(...buildDripPoints(p, column, startY, "left"));
    points.push(...buildDripPoints(p, column, startY, "right"));
    points.push({ x: rightAttach, y: getReservoirYAt(band, rightAttach) });
  });

  const lastColumn = visibleColumns[visibleColumns.length - 1];
  const lastStart = clamp(lastColumn.x + lastColumn.dripWidth * 0.9, band.bandLeft, band.bandRight);
  points.push(...buildArchPoints(p, band, lastStart, band.bandRight, lastColumn.archDepth));

  return smoothPoints(points, 1);
}

function drawPaintBand(p, band) {
  const { r, g, b } = hexToRgb(band.color);
  const bottomEdge = smoothPoints(buildBottomEdgePoints(p, band), 1);

  p.noStroke();
  p.fill(r, g, b, band.alpha);
  p.beginShape();
  p.vertex(band.bandLeft, 0);
  p.vertex(band.bandRight, 0);
  p.vertex(band.bandRight, getReservoirYAt(band, band.bandRight));

  for (let i = bottomEdge.length - 1; i >= 0; i -= 1) {
    p.vertex(bottomEdge[i].x, bottomEdge[i].y);
  }

  p.vertex(band.bandLeft, getReservoirYAt(band, band.bandLeft));
  p.endShape(p.CLOSE);

  drawFadeMasks(p, band);
  drawEdgeResidue(p, band);
  drawBandHighlights(p, band);
  drawSatelliteDroplets(p, band);
}

function drawFadeMasks(p, band) {
  const bg = hexToRgb(band.background);
  for (const column of band.columns) {
    if (column.phase !== "fading" || column.alpha > 190) continue;

    const maskAlpha = p.map(column.alpha, 190, 0, 0, 225, true);
    const startY = getReservoirYAt(band, column.x);
    const points = [
      ...buildDripPoints(p, column, startY, "left"),
      ...buildDripPoints(p, column, startY, "right"),
    ];

    p.noStroke();
    p.fill(bg.r, bg.g, bg.b, maskAlpha);
    p.beginShape();
    for (const point of smoothPoints(points, 1)) {
      p.vertex(point.x, point.y);
    }
    p.endShape(p.CLOSE);
  }
}

function drawEdgeResidue(p, band) {
  const { r, g, b } = hexToRgb(band.color);
  p.noStroke();
  p.fill(r, g, b, 36);
  for (const column of band.columns) {
    if (!column.residue || column.phase === "waiting") continue;
    const y = getReservoirYAt(band, column.x);
    p.ellipse(column.x + column.dripWidth * 1.2, y + column.dripWidth * 0.45, column.dripWidth * 0.58, column.dripWidth * 0.34);
  }
}

function drawBandHighlights(p, band) {
  p.fill(255, 255, 255, 24);
  for (const column of band.columns) {
    if (column.alpha < 60 || column.dripWidth < 18 || column.type === "tendril") continue;
    const highlightLength = Math.min(column.dripLength * 0.72, column.maxLength * 0.48);
    const y = getReservoirYAt(band, column.x);
    p.ellipse(
      column.x - column.dripWidth * 0.24,
      y + highlightLength * 0.48,
      column.dripWidth * 0.28,
      highlightLength,
    );
  }
}

function drawSatelliteDroplets(p, band) {
  const { r, g, b } = hexToRgb(band.color);
  p.noStroke();
  p.fill(r, g, b, 92);
  for (const column of band.columns) {
    if (column.type !== "hero" || column.phase === "waiting" || column.alpha < 80) continue;
    const startY = getReservoirYAt(band, column.x);
    const y = startY + column.dripLength + column.bulgeRadius * 1.8;
    if (y > p.height * 0.96) continue;
    p.circle(column.x + Math.sin(column.seed) * column.dripWidth * 1.4, y, column.dripWidth * 0.42);
  }
}

export function FacemeltVisualizer(props) {
  const createSketch = useCallback(({ getProps, getHost, isCurrent }) => {
    return (p) => {
      let bands = [];
      let currentSignature = "";

      function rebuild() {
        const { mode, visualIntensity } = getProps();
        const preset = createFacemeltPreset(mode, visualIntensity);
        bands = createBands(p, preset);
        currentSignature = `${mode}:${mode === "exam" ? "low" : visualIntensity}:${p.width}:${p.height}`;
      }

      p.setup = () => {
        const host = getHost();
        const canvas = p.createCanvas(host.clientWidth, host.clientHeight);
        canvas.parent(host);
        if (!isCurrent()) {
          p.remove();
          return;
        }
        host.querySelectorAll("canvas").forEach((element) => {
          if (element !== canvas.elt) element.remove();
        });
        p.noStroke();
        rebuild();
      };

      p.windowResized = () => {
        const host = getHost();
        p.resizeCanvas(host.clientWidth, host.clientHeight);
        rebuild();
      };

      p.draw = () => {
        const { mode, visualIntensity } = getProps();
        const preset = createFacemeltPreset(mode, visualIntensity);
        const nextSignature = `${mode}:${mode === "exam" ? "low" : visualIntensity}:${p.width}:${p.height}`;

        if (nextSignature !== currentSignature) {
          rebuild();
        }

        const bg = hexToRgb(preset.background);
        p.background(bg.r, bg.g, bg.b);

        for (const band of bands) {
          for (const column of band.columns) {
            updateColumn(p, column, preset);
          }
          drawPaintBand(p, band);
        }
      };
    };
  }, []);

  const hostRef = useP5Sketch(createSketch, props);
  return <div className="facemelt-visualizer" ref={hostRef} aria-hidden="true" />;
}
