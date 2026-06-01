import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export function usePixiApp(createApp, props) {
  const hostRef     = useRef(null);
  const latestProps = useRef(props);
  const mountIdRef  = useRef(0);

  useEffect(() => { latestProps.current = props; }, [props]);

  useEffect(() => {
    if (!hostRef.current) return;
    const host    = hostRef.current;
    const mountId = ++mountIdRef.current;
    host.replaceChildren();

    const app = new PIXI.Application({
      resizeTo:        host,
      backgroundColor: 0x020408,
      antialias:       true,
      resolution:      window.devicePixelRatio || 1,
      autoDensity:     true,
    });
    host.appendChild(app.view);

    const getProps  = () => latestProps.current;
    const isCurrent = () => mountId === mountIdRef.current;

    createApp({ app, getProps, isCurrent });

    return () => {
      if (mountId === mountIdRef.current) mountIdRef.current += 1;
      app.destroy(true, { children: true, texture: true, baseTexture: true });
      host.replaceChildren();
    };
  }, [createApp]); // createApp is useCallback-stable per visualizer

  return hostRef;
}
