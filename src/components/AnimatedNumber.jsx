import { useEffect, useRef, useState } from 'react';

export default function AnimatedNumber({ value, formatter = (v) => String(v) }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = to;
    setDisplay(to);

    if (from === to) return;

    const duration = 900;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{formatter(display)}</>;
}
