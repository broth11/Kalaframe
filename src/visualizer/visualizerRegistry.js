import { AuroraVisualizer } from "./p5/AuroraVisualizer.jsx";
import { DotsVisualizer } from "./p5/DotsVisualizer.jsx";
import { GeometricWavesVisualizer } from "./p5/GeometricWavesVisualizer.jsx";
import { InkblotVisualizer } from "./p5/InkblotVisualizer.jsx";
import { FacemeltShaderVisualizer } from "./shader/FacemeltShaderVisualizer.jsx";
import { InkblotSvgVisualizer } from "./svg/InkblotSvgVisualizer.jsx";
import { LavaMetaballVisualizer } from "./webgl/LavaMetaballVisualizer.jsx";
import { VoidNebulaVisualizer } from "./webgl/VoidNebulaVisualizer.jsx";
import { NodeVisualizer } from "./pixi/NodeVisualizer.jsx";
import { ThermalLifeVisualizer } from "./pixi/ThermalLifeVisualizer.jsx";
import { LissajousVisualizer } from "./pixi/LissajousVisualizer.jsx";
import dotsPreview from "../assets/visualizer-previews/dots.png";
import facemeltPreview from "../assets/visualizer-previews/facemelt.png";
import auroraPreview from "../assets/visualizer-previews/aurora.png";
import geometricWavesPreview from "../assets/visualizer-previews/geometric-waves.png";
import nodePreview from "../assets/visualizer-previews/node.png";
import thermalLifePreview from "../assets/visualizer-previews/thermal-life.png";
import lissajousPreview from "../assets/visualizer-previews/lissajous.png";
import lavaMetaballPreview from "../assets/visualizer-previews/lava-metaball.png";
import voidNebulaPreview from "../assets/visualizer-previews/void-nebula.png";
import inkblotPreview from "../assets/visualizer-previews/inkblot.png";
import inkblotSvgPreview from "../assets/visualizer-previews/inkblot-svg.png";

export const DEFAULT_THEME_ID = "dots";

export const THEME_ID_MIGRATIONS = {
  lava:        "dots",
  lavaLamp:    "lavaMetaball",
  ambientBlobs: "dots",
  void:        "voidNebula",
};

export const visualizerRegistry = {
  dots: {
    id: "dots",
    label: "Dots",
    engine: "p5",
    component: DotsVisualizer,
    description: "Soft drifting colored dots from the original MVP visualizer.",
    previewImage: dotsPreview,
    previewAlt: "Dots visualizer preview with soft drifting colored circles.",
    previewClass: "preview-dots",
    mood: "Soft focus",
    classroomUse: "General work time",
  },
  facemelt: {
    id: "facemelt",
    label: "Facemelt",
    engine: "shader",
    component: FacemeltShaderVisualizer,
    description: "WebGL shader liquid meltfield.",
    previewImage: facemeltPreview,
    previewAlt: "Facemelt visualizer preview with bright liquid paint bands.",
    previewClass: "preview-facemelt",
    mood: "High energy",
    classroomUse: "Transitions and dramatic countdowns",
  },
  aurora: {
    id: "aurora",
    label: "Aurora",
    engine: "p5",
    component: AuroraVisualizer,
    description: "Layered translucent ribbon bands with low-aggression motion.",
    previewImage: auroraPreview,
    previewAlt: "Aurora visualizer preview with layered teal, blue, and purple ribbon bands.",
    previewClass: "preview-aurora",
    mood: "Calm flow",
    classroomUse: "Quiet work and reflection",
  },
  geometricWaves: {
    id: "geometricWaves",
    label: "Geometric Waves",
    engine: "p5",
    component: GeometricWavesVisualizer,
    description: "Subtle mathematical wave lines for structured activities.",
    previewImage: geometricWavesPreview,
    previewAlt: "Geometric waves visualizer preview with mathematical blue line waves.",
    previewClass: "preview-geometric",
    mood: "Structured",
    classroomUse: "Math, science, and focused tasks",
  },
  node: {
    id:          "node",
    label:       "Node",
    engine:      "pixi",
    component:   NodeVisualizer,
    description: "Connected node network — collaborative energy for discussion.",
    previewImage: nodePreview,
    previewAlt: "Node visualizer preview with connected points on a dark field.",
    previewClass: "preview-node",
    mood: "Connected",
    classroomUse: "Discussion and collaboration",
  },
  thermalLife: {
    id:          "thermalLife",
    label:       "Thermal",
    engine:      "pixi",
    component:   ThermalLifeVisualizer,
    description: "Conway life with heat decay trails — living thermal map.",
    previewImage: thermalLifePreview,
    previewAlt: "Thermal life visualizer preview with glowing heat-map cellular trails.",
    previewClass: "preview-thermal",
    mood: "Organic",
    classroomUse: "Exploration and discovery",
  },
  lissajous: {
    id:          "lissajous",
    label:       "Lissajous",
    engine:      "pixi",
    component:   LissajousVisualizer,
    description: "Parametric curves cycling through 12 classic ratios.",
    previewImage: lissajousPreview,
    previewAlt: "Lissajous visualizer preview with layered parametric curves.",
    previewClass: "preview-lissajous",
    mood: "Precise",
    classroomUse: "Calm focus with motion",
  },
  lavaMetaball: {
    id: "lavaMetaball",
    label: "Lava",
    engine: "webgl",
    component: LavaMetaballVisualizer,
    description: "GPU metaball blobs with SDF rendering.",
    previewImage: lavaMetaballPreview,
    previewAlt: "Lava visualizer preview with glowing liquid metaball blobs.",
    previewClass: "preview-lava",
    mood: "Liquid",
    classroomUse: "Active work and transitions",
  },
  voidNebula: {
    id: "voidNebula",
    label: "Void",
    engine: "webgl",
    component: VoidNebulaVisualizer,
    description: "WebGL domain-warped nebula with star field.",
    previewImage: voidNebulaPreview,
    previewAlt: "Void nebula visualizer preview with a deep warped star field.",
    previewClass: "preview-void",
    mood: "Deep focus",
    classroomUse: "Exams and sustained focus",
  },
  inkblot: {
    id: "inkblot",
    label: "Inkblot",
    engine: "p5",
    component: InkblotVisualizer,
    description: "White-background mirrored black inkblot forms.",
    previewImage: inkblotPreview,
    previewAlt: "Inkblot visualizer preview with mirrored black ink on white.",
    previewClass: "preview-inkblot",
    mood: "High contrast",
    classroomUse: "Readable, expressive display",
  },
  inkblotSvg: {
    id: "inkblotSvg",
    label: "Inkblot SVG",
    engine: "svg",
    component: InkblotSvgVisualizer,
    description: "Smooth mirrored SVG inkblot forms.",
    previewImage: inkblotSvgPreview,
    previewAlt: "Inkblot SVG visualizer preview with smooth mirrored black ink on white.",
    previewClass: "preview-inkblot-svg",
    mood: "Smooth contrast",
    classroomUse: "Readable, expressive display",
    showInCarousel: false,
  },
};

export const visualizerOptions = Object.values(visualizerRegistry);
export const visualizerPickerOptions = visualizerOptions.filter(
  (visualizer) => visualizer.showInCarousel !== false,
);

export function getVisualizerLabel(themeId) {
  return getVisualizer(themeId).label;
}

export function normalizeThemeId(themeId) {
  const migrated = THEME_ID_MIGRATIONS[themeId] ?? themeId;
  return visualizerRegistry[migrated] ? migrated : DEFAULT_THEME_ID;
}

export function getVisualizer(themeId) {
  return visualizerRegistry[normalizeThemeId(themeId)];
}
