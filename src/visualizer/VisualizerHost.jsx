import { getVisualizer, normalizeThemeId } from "./visualizerRegistry.js";

export function VisualizerHost(props) {
  const theme = normalizeThemeId(props.theme);
  const visualizer = getVisualizer(theme);
  const VisualizerComponent = visualizer.component;

  return <VisualizerComponent key={theme} {...props} theme={theme} />;
}
