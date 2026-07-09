import { Suspense } from "react";
import { getVisualizer, normalizeThemeId } from "./visualizerRegistry.js";

export function VisualizerHost(props) {
  const theme = normalizeThemeId(props.theme);
  const visualizer = getVisualizer(theme);
  const VisualizerComponent = visualizer.component;

  return (
    <Suspense fallback={<div className="visualizer-loading-fallback" aria-hidden="true" />}>
      <VisualizerComponent key={theme} {...props} theme={theme} />
    </Suspense>
  );
}
