import { useEffect, useRef } from "react";
import p5 from "p5";

export function useP5Sketch(createSketch, props) {
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
    let sketchInstance;
    host.replaceChildren();

    const sketch = createSketch({
      getProps: () => latestPropsRef.current,
      getHost: () => host,
      isCurrent: () => mountId === mountIdRef.current,
    });

    sketchInstance = new p5(sketch);

    return () => {
      if (mountId === mountIdRef.current) {
        mountIdRef.current += 1;
      }
      sketchInstance?.remove();
      host.replaceChildren();
    };
  }, [createSketch]);

  return hostRef;
}
