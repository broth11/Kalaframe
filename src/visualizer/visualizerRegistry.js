import { lazy } from "react";
import { AuroraVisualizer } from "./p5/AuroraVisualizer.jsx";
import { DotsVisualizer } from "./p5/DotsVisualizer.jsx";
import { GeometricWavesVisualizer } from "./p5/GeometricWavesVisualizer.jsx";
import { InkblotVisualizer } from "./p5/InkblotVisualizer.jsx";
import { FirefliesVisualizer } from "./p5/FirefliesVisualizer.jsx";
import { OceanDepthsVisualizer } from "./p5/OceanDepthsVisualizer.jsx";
import { GardenBloomVisualizer } from "./p5/GardenBloomVisualizer.jsx";
import { JellyDriftVisualizer } from "./p5/JellyDriftVisualizer.jsx";
import { CometTrailsVisualizer } from "./p5/CometTrailsVisualizer.jsx";
import { BalloonRiseVisualizer } from "./p5/BalloonRiseVisualizer.jsx";
import { InkKoiVisualizer } from "./p5/InkKoiVisualizer.jsx";
import { FacemeltShaderVisualizer } from "./shader/FacemeltShaderVisualizer.jsx";
import { InkblotSvgVisualizer } from "./svg/InkblotSvgVisualizer.jsx";
import { LavaMetaballVisualizer } from "./webgl/LavaMetaballVisualizer.jsx";
import { VoidNebulaVisualizer } from "./webgl/VoidNebulaVisualizer.jsx";
import { NodeVisualizer } from "./pixi/NodeVisualizer.jsx";
import { ThermalLifeVisualizer } from "./pixi/ThermalLifeVisualizer.jsx";
import { LissajousVisualizer } from "./pixi/LissajousVisualizer.jsx";
import { StarVoyageVisualizer } from "./pixi/StarVoyageVisualizer.jsx";
import { PixelQuestVisualizer } from "./pixi/PixelQuestVisualizer.jsx";
import { CrystalCaveVisualizer } from "./pixi/CrystalCaveVisualizer.jsx";
import { AuroraGlassVisualizer } from "./dom/AuroraGlassVisualizer.jsx";
import { LanternFloatVisualizer } from "./dom/LanternFloatVisualizer.jsx";
import { ConfettiPhysicsVisualizer } from "./worker/ConfettiPhysicsVisualizer.jsx";
import { BoidsSchoolVisualizer } from "./worker/BoidsSchoolVisualizer.jsx";
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
import firefliesPreview from "../assets/visualizer-previews/fireflies.svg";
import oceanDepthsPreview from "../assets/visualizer-previews/ocean-depths.svg";
import starVoyagePreview from "../assets/visualizer-previews/star-voyage.svg";
import gardenBloomPreview from "../assets/visualizer-previews/garden-bloom.svg";
import pixelQuestPreview from "../assets/visualizer-previews/pixel-quest.svg";
import jellyDriftPreview from "../assets/visualizer-previews/jelly-drift.svg";
import cometTrailsPreview from "../assets/visualizer-previews/comet-trails.svg";
import balloonRisePreview from "../assets/visualizer-previews/balloon-rise.svg";
import crystalCavePreview from "../assets/visualizer-previews/crystal-cave.svg";
import inkKoiPreview from "../assets/visualizer-previews/ink-koi.svg";
import orbitIslePreview from "../assets/visualizer-previews/orbit-isle.svg";
import prismDriftPreview from "../assets/visualizer-previews/prism-drift.svg";
import auroraGlassPreview from "../assets/visualizer-previews/aurora-glass.svg";
import lanternFloatPreview from "../assets/visualizer-previews/lantern-float.svg";
import confettiPhysicsPreview from "../assets/visualizer-previews/confetti-physics.svg";
import boidsSchoolPreview from "../assets/visualizer-previews/boids-school.svg";

const OrbitIsleVisualizer = lazy(() => import("./three/OrbitIsleVisualizer.jsx").then(
  (module) => ({ default: module.OrbitIsleVisualizer }),
));
const PrismDriftVisualizer = lazy(() => import("./three/PrismDriftVisualizer.jsx").then(
  (module) => ({ default: module.PrismDriftVisualizer }),
));

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
  fireflies: {
    id: "fireflies",
    label: "Fireflies",
    engine: "p5",
    component: FirefliesVisualizer,
    description: "Glowing meadow fireflies that gather as time runs out.",
    previewImage: firefliesPreview,
    previewAlt: "Fireflies glowing over a dark meadow.",
    previewClass: "preview-fireflies",
    mood: "Magical calm",
    classroomUse: "Reading and quiet work",
  },
  oceanDepths: {
    id: "oceanDepths",
    label: "Ocean Depths",
    engine: "p5",
    component: OceanDepthsVisualizer,
    description: "Bubbles and fish drift upward toward brighter surface water.",
    previewImage: oceanDepthsPreview,
    previewAlt: "Deep ocean water with bubbles, light rays, and fish.",
    previewClass: "preview-ocean-depths",
    mood: "Deep calm",
    classroomUse: "Sustained focus",
  },
  starVoyage: {
    id: "starVoyage",
    label: "Star Voyage",
    engine: "pixi",
    component: StarVoyageVisualizer,
    description: "A colorful warp-speed journey through stars and a distant galaxy.",
    previewImage: starVoyagePreview,
    previewAlt: "Warping stars converging on a distant purple galaxy.",
    previewClass: "preview-star-voyage",
    mood: "Epic",
    classroomUse: "Challenges and countdowns",
  },
  gardenBloom: {
    id: "gardenBloom",
    label: "Garden Bloom",
    engine: "p5",
    component: GardenBloomVisualizer,
    description: "A procedural garden grows and blooms throughout the timer.",
    previewImage: gardenBloomPreview,
    previewAlt: "Bright flowers blooming in a twilight garden.",
    previewClass: "preview-garden-bloom",
    mood: "Growing",
    classroomUse: "Creative work and goal tracking",
  },
  pixelQuest: {
    id: "pixelQuest",
    label: "Pixel Quest",
    engine: "pixi",
    component: PixelQuestVisualizer,
    description: "A retro hero crosses a scrolling world from day to sunset.",
    previewImage: pixelQuestPreview,
    previewAlt: "Pixel-art hero in a layered side-scrolling landscape.",
    previewClass: "preview-pixel-quest",
    mood: "Adventurous",
    classroomUse: "Games, transitions, and active work",
  },
  jellyDrift: {
    id: "jellyDrift",
    label: "Jelly Drift",
    engine: "p5",
    component: JellyDriftVisualizer,
    description: "Translucent jellyfish pulse upward through a dark teal sea.",
    previewImage: jellyDriftPreview,
    previewAlt: "Glowing jellyfish drifting in dark teal water.",
    previewClass: "preview-jelly-drift",
    mood: "Dreamlike",
    classroomUse: "Quiet independent work",
  },
  cometTrails: {
    id: "cometTrails",
    label: "Comet Trails",
    engine: "p5",
    component: CometTrailsVisualizer,
    description: "Arcing comets cross a sky whose constellations connect over time.",
    previewImage: cometTrailsPreview,
    previewAlt: "Bright comets arcing through a starry purple sky.",
    previewClass: "preview-comet-trails",
    mood: "Energized",
    classroomUse: "Fast challenges and transitions",
  },
  balloonRise: {
    id: "balloonRise",
    label: "Balloon Rise",
    engine: "p5",
    component: BalloonRiseVisualizer,
    description: "Colorful balloons rise through a sky shifting from dawn to day.",
    previewImage: balloonRisePreview,
    previewAlt: "Colorful balloons rising through a soft sunrise sky.",
    previewClass: "preview-balloon-rise",
    mood: "Celebratory",
    classroomUse: "Class celebrations and younger learners",
  },
  crystalCave: {
    id: "crystalCave",
    label: "Crystal Cave",
    engine: "pixi",
    component: CrystalCaveVisualizer,
    description: "Glinting crystals grow from cave edges as ambient dust drifts.",
    previewImage: crystalCavePreview,
    previewAlt: "Blue, purple, and pink crystals in a dark cave.",
    previewClass: "preview-crystal-cave",
    mood: "Mysterious",
    classroomUse: "Discovery and deep focus",
  },
  inkKoi: {
    id: "inkKoi",
    label: "Ink Koi",
    engine: "p5",
    component: InkKoiVisualizer,
    description: "Sumi-e koi circle across a high-readability paper field.",
    previewImage: inkKoiPreview,
    previewAlt: "Black and red ink koi swimming on warm white paper.",
    previewClass: "preview-ink-koi",
    mood: "Contemplative",
    classroomUse: "Readable displays and calm reflection",
  },
  orbitIsle: {
    id: "orbitIsle",
    label: "Orbit Isle",
    engine: "three",
    component: OrbitIsleVisualizer,
    description: "A low-poly floating island beneath an orbiting dusk sky.",
    previewImage: orbitIslePreview,
    previewAlt: "Low-poly floating island with trees, clouds, and fireflies.",
    previewClass: "preview-orbit-isle",
    mood: "Wonder",
    classroomUse: "General work time",
  },
  prismDrift: {
    id: "prismDrift",
    label: "Prism Drift",
    engine: "three",
    component: PrismDriftVisualizer,
    description: "Translucent geometric prisms drift through a softly lit fog.",
    previewImage: prismDriftPreview,
    previewAlt: "Glowing translucent prisms drifting through dark blue fog.",
    previewClass: "preview-prism-drift",
    mood: "Deep focus",
    classroomUse: "Exams and sustained focus",
  },
  auroraGlass: {
    id: "auroraGlass",
    label: "Aurora Glass",
    engine: "dom",
    component: AuroraGlassVisualizer,
    description: "Blurred aurora color fields flow behind a frosted glass sheen.",
    previewImage: auroraGlassPreview,
    previewAlt: "Teal, blue, and violet aurora glows behind frosted glass.",
    previewClass: "preview-aurora-glass",
    mood: "Calm flow",
    classroomUse: "Quiet work and reflection",
  },
  lanternFloat: {
    id: "lanternFloat",
    label: "Lantern Float",
    engine: "dom",
    component: LanternFloatVisualizer,
    description: "Warm paper lanterns rise gently through a starry night.",
    previewImage: lanternFloatPreview,
    previewAlt: "Warm glowing lanterns floating into a starry purple sky.",
    previewClass: "preview-lantern-float",
    mood: "Gentle rise",
    classroomUse: "Reflection and wind-down",
  },
  confettiPhysics: {
    id: "confettiPhysics",
    label: "Confetti Physics",
    engine: "worker",
    component: ConfettiPhysicsVisualizer,
    description: "A responsive field of falling, fluttering celebration confetti.",
    previewImage: confettiPhysicsPreview,
    previewAlt: "Colorful confetti and ribbon streamers falling on a dark field.",
    previewClass: "preview-confetti-physics",
    mood: "Celebration",
    classroomUse: "Games and transitions",
  },
  boidsSchool: {
    id: "boidsSchool",
    label: "Boids School",
    engine: "worker",
    component: BoidsSchoolVisualizer,
    description: "Flocking fish gather into a coordinated deep-water school.",
    previewImage: boidsSchoolPreview,
    previewAlt: "Groups of small fish schooling in deep teal water.",
    previewClass: "preview-boids-school",
    mood: "Organic",
    classroomUse: "Exploration and discovery",
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
