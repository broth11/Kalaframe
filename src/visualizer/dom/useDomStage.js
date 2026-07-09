import { useEffect, useRef } from "react";
import { resolveIntensity } from "../intensityContract.js";

export function useDomStage(props) {
  const hostRef = useRef(null);
  const latestPropsRef = useRef(props);
  const mountIdRef = useRef(0);

  useEffect(() => {
    latestPropsRef.current = props;
  }, [props]);

  useEffect(() => {
    if (!hostRef.current) return undefined;
    const host = hostRef.current;
    const mountId = ++mountIdRef.current;
    host.replaceChildren(...Array.from(host.childNodes));

    let frameId = 0;
    function updateProperties() {
      if (mountId !== mountIdRef.current) return;
      const {
        mode,
        progress = 0,
        remainingSeconds = 0,
        reducedMotion,
        visualIntensity,
      } = latestPropsRef.current;
      const intensity = resolveIntensity(mode, visualIntensity);
      const motionMultiplier = reducedMotion ? 0.25 : 1;
      host.style.setProperty("--progress", String(Math.min(1, Math.max(0, progress))));
      host.style.setProperty("--remaining", String(Math.max(0, remainingSeconds)));
      host.style.setProperty("--intensity-speed", String(intensity.speedScale * motionMultiplier));
      host.style.setProperty("--intensity-count", String(intensity.countScale));
      host.style.setProperty("--intensity-saturation", String(intensity.saturation));
      host.style.setProperty("--reduced-motion", reducedMotion ? "1" : "0");
      host.style.setProperty("--animation-duration", `${32 / (intensity.speedScale * motionMultiplier)}s`);
      host.style.setProperty("--long-animation-duration", `${40 / (intensity.speedScale * motionMultiplier)}s`);
      frameId = requestAnimationFrame(updateProperties);
    }
    frameId = requestAnimationFrame(updateProperties);

    return () => {
      if (mountId === mountIdRef.current) mountIdRef.current += 1;
      cancelAnimationFrame(frameId);
      queueMicrotask(() => {
        if (mountIdRef.current === mountId + 1) host.replaceChildren();
      });
    };
  }, []);

  return hostRef;
}
