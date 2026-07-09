import { useEffect, useRef } from "react";
import * as THREE from "three";

function disposeScene(scene) {
  scene?.traverse((object) => {
    object.geometry?.dispose?.();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.filter(Boolean).forEach((material) => {
      Object.values(material).forEach((value) => {
        if (value?.isTexture) value.dispose();
      });
      material.dispose?.();
    });
  });
}

export function useThreeScene(createScene, props) {
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    let trackedScene = null;
    let trackedCamera = null;
    let resizeCallback = null;
    const lifecycle = createScene({
      renderer,
      getProps: () => latestPropsRef.current,
      getHost: () => host,
      isCurrent: () => mountId === mountIdRef.current,
      registerScene: (scene, camera) => {
        trackedScene = scene;
        trackedCamera = camera;
      },
      onResize: (callback) => {
        resizeCallback = callback;
      },
    });

    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      if (trackedCamera?.isPerspectiveCamera) {
        trackedCamera.aspect = width / height;
        trackedCamera.updateProjectionMatrix();
      }
      resizeCallback?.(width, height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let frameId = 0;
    let lastTime = performance.now();
    function tick(now) {
      if (mountId !== mountIdRef.current) return;
      const deltaSeconds = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      lifecycle?.update?.(deltaSeconds);
      if (trackedScene && trackedCamera) renderer.render(trackedScene, trackedCamera);
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);

    return () => {
      if (mountId === mountIdRef.current) mountIdRef.current += 1;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      lifecycle?.dispose?.();
      disposeScene(trackedScene);
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      host.replaceChildren();
    };
  }, [createScene]);

  return hostRef;
}
