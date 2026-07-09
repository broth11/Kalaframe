import { useCallback } from "react";
import { resolveIntensity } from "../intensityContract.js";
import { createBoidsRenderer } from "./boidsRender.js";
import { useOffscreenCanvas } from "./useOffscreenCanvas.js";

export function BoidsSchoolVisualizer(props) {
  resolveIntensity(props.mode, props.visualIntensity);
  const createRenderer = useCallback(() => createBoidsRenderer(), []);
  const hostRef = useOffscreenCanvas(createRenderer, "boidsSchool", props);
  return <div className="boids-school-visualizer" ref={hostRef} aria-hidden="true" />;
}
