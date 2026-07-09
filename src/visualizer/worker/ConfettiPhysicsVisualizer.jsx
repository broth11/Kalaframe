import { useCallback } from "react";
import { resolveIntensity } from "../intensityContract.js";
import { createConfettiRenderer } from "./confettiRender.js";
import { useOffscreenCanvas } from "./useOffscreenCanvas.js";

export function ConfettiPhysicsVisualizer(props) {
  resolveIntensity(props.mode, props.visualIntensity);
  const createRenderer = useCallback(() => createConfettiRenderer(), []);
  const hostRef = useOffscreenCanvas(createRenderer, "confettiPhysics", props);
  return <div className="confetti-physics-visualizer" ref={hostRef} aria-hidden="true" />;
}
