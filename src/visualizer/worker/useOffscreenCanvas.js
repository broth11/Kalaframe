import { useEffect, useRef } from "react";

const PROP_INTERVAL_MS = 100;

function selectProps(props) {
  return {
    progress: props.progress ?? 0,
    remainingSeconds: props.remainingSeconds ?? 0,
    totalSeconds: props.totalSeconds ?? 0,
    mode: props.mode ?? "active",
    visualIntensity: props.visualIntensity ?? "normal",
    reducedMotion: Boolean(props.reducedMotion),
  };
}

export function useOffscreenCanvas(createRenderer, rendererId, props) {
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
    host.replaceChildren();

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    host.appendChild(canvas);

    const canUseWorker = Boolean(
      canvas.transferControlToOffscreen
      && !window.__KALAFRAME_FORCE_OFFSCREEN_FALLBACK__,
    );
    host.dataset.renderThread = canUseWorker ? "worker" : "main";
    let worker = null;
    let renderer = null;
    let animationFrame = 0;
    let propsTimer = 0;

    if (canUseWorker) {
      const offscreen = canvas.transferControlToOffscreen();
      worker = new Worker(new URL("./render.worker.js", import.meta.url), { type: "module" });
      worker.postMessage({ type: "init", rendererId, canvas: offscreen }, [offscreen]);
    } else {
      renderer = createRenderer({
        getProps: () => latestPropsRef.current,
        getHost: () => host,
        isCurrent: () => mountId === mountIdRef.current,
      });
      renderer.init(canvas);
      let lastTime = performance.now();
      const tick = (now) => {
        if (mountId !== mountIdRef.current) return;
        const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;
        renderer.frame({ ...selectProps(latestPropsRef.current), deltaSeconds, now });
        animationFrame = requestAnimationFrame(tick);
      };
      animationFrame = requestAnimationFrame(tick);
    }

    function sendProps() {
      if (mountId !== mountIdRef.current) return;
      worker?.postMessage({ type: "props", ...selectProps(latestPropsRef.current) });
      propsTimer = window.setTimeout(sendProps, PROP_INTERVAL_MS);
    }
    sendProps();

    const resizeObserver = new ResizeObserver(() => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (worker) worker.postMessage({ type: "resize", width, height, dpr });
      else renderer?.resize(width, height, dpr);
    });
    resizeObserver.observe(host);

    return () => {
      if (mountId === mountIdRef.current) mountIdRef.current += 1;
      window.clearTimeout(propsTimer);
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      if (worker) {
        worker.postMessage({ type: "destroy" });
        worker.terminate();
      } else {
        renderer?.destroy();
      }
      delete host.dataset.renderThread;
      host.replaceChildren();
    };
  }, [createRenderer, rendererId]);

  return hostRef;
}
