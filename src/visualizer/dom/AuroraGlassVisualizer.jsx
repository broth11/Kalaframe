import { resolveIntensity } from "../intensityContract.js";
import { useDomStage } from "./useDomStage.js";
import "./domVisualizers.css";

const BLOBS = [
  { color: "#19d9c5", left: "4%", top: "6%", delay: "-4s" },
  { color: "#5e7bff", left: "55%", top: "2%", delay: "-13s" },
  { color: "#b55cff", left: "28%", top: "44%", delay: "-21s" },
  { color: "#17b8ff", left: "72%", top: "48%", delay: "-28s" },
  { color: "#ff5da8", left: "8%", top: "56%", delay: "-9s" },
  { color: "#52f1a8", left: "48%", top: "65%", delay: "-17s" },
  { color: "#7868ff", left: "78%", top: "18%", delay: "-25s" },
];

export function AuroraGlassVisualizer(props) {
  const intensity = resolveIntensity(props.mode, props.visualIntensity);
  const count = Math.max(2, Math.round(4 * intensity.countScale));
  const hostRef = useDomStage(props);

  return (
    <div
      className="aurora-glass-visualizer"
      ref={hostRef}
      aria-hidden="true"
      data-low={intensity.countScale < 0.5 || undefined}
      data-extras={intensity.extras || undefined}
    >
      <div className="aurora-glass-field">
        {BLOBS.slice(0, count).map((blob, index) => (
          <span
            className="aurora-glass-blob"
            key={blob.color}
            style={{
              "--blob-color": blob.color,
              "--blob-left": blob.left,
              "--blob-top": blob.top,
              "--blob-delay": blob.delay,
              "--blob-index": index,
            }}
          />
        ))}
        <span className="aurora-glass-sheen" />
        {intensity.extras ? <span className="aurora-glass-shimmer" /> : null}
      </div>
    </div>
  );
}
