import { useEffect, useRef, useState } from 'react';

/** Show / pin chart filter only while the charts section is on screen. */
export function useChartSectionSticky(sectionRef) {
  const [sectionVisible, setSectionVisible] = useState(false);
  const [pinned, setPinned] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const node = sectionRef?.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSectionVisible(entry.isIntersecting),
      { threshold: 0.02 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionRef]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !sectionVisible) {
      setPinned(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setPinned(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-8px 0px 0px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sectionVisible]);

  return { sectionVisible, pinned, sentinelRef };
}
