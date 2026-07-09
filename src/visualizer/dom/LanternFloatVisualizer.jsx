import { resolveIntensity } from "../intensityContract.js";
import { useDomStage } from "./useDomStage.js";
import "./domVisualizers.css";

function seededValue(index, multiplier, modulo = 100) {
  return (index * multiplier + 17) % modulo;
}

export function LanternFloatVisualizer(props) {
  const intensity = resolveIntensity(props.mode, props.visualIntensity);
  const lanternCount = Math.max(6, Math.round(24 * intensity.countScale));
  const starCount = Math.max(18, Math.round(70 * intensity.countScale));
  const hostRef = useDomStage(props);

  return (
    <div
      className="lantern-float-visualizer"
      ref={hostRef}
      aria-hidden="true"
      data-low={intensity.countScale < 0.5 || undefined}
      data-extras={intensity.extras || undefined}
    >
      <div className="lantern-sky">
        {Array.from({ length: starCount }, (_, index) => (
          <i
            className="lantern-star"
            key={`star-${index}`}
            style={{
              left: `${seededValue(index, 47)}%`,
              top: `${seededValue(index, 29, 72)}%`,
              opacity: 0.25 + seededValue(index, 13, 60) / 100,
            }}
          />
        ))}
        {Array.from({ length: lanternCount }, (_, index) => (
          <span
            className="lantern"
            key={`lantern-${index}`}
            style={{
              "--lantern-x": `${seededValue(index, 37)}%`,
              "--lantern-delay": `${-seededValue(index, 11, 32)}s`,
              "--lantern-scale": 0.55 + seededValue(index, 19, 65) / 100,
              "--lantern-hue": `${seededValue(index, 17, 42) - 12}deg`,
            }}
          >
            <b />
          </span>
        ))}
      </div>
    </div>
  );
}
