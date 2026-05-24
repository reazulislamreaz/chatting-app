"use client";

import { useEffect, useRef } from "react";

type UseIntersectionObserverOptions = IntersectionObserverInit & {
  enabled?: boolean;
};

export function useIntersectionObserver(
  callback: () => void,
  options?: UseIntersectionObserverOptions,
) {
  const targetRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const enabled = options?.enabled ?? true;
  const root = options?.root;
  const rootMargin = options?.rootMargin;
  const threshold = options?.threshold;

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callbackRef.current();
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [enabled, root, rootMargin, threshold]);

  return targetRef;
}
