import { useLayoutEffect, useRef, useState } from "react";

export function useStageSize(initial = { w: 908, h: 546 }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initial);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      const styles = getComputedStyle(element);
      const width =
        element.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);
      const height =
        element.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
      if (width < 40 || height < 40) return;
      setSize((current) =>
        Math.abs(current.w - width) > 0.5 || Math.abs(current.h - height) > 0.5
          ? { w: width, h: height }
          : current
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}
