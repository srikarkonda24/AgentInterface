"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type UseInViewOptions = {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
};

type UseInViewResult = {
  ref: RefObject<HTMLDivElement | null>;
  isInView: boolean;
};

export function useInView(
  options: UseInViewOptions = {}
): UseInViewResult {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -8% 0px",
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}
