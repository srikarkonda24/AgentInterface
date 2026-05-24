"use client";

import type { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";

type AnimateInProps = {
  children: ReactNode;
  delayMs?: number;
  className?: string;
};

export function AnimateIn({
  children,
  delayMs = 0,
  className = "",
}: AnimateInProps) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`reveal-transition ${isInView ? "reveal-visible" : "reveal-hidden"} ${className}`}
      style={{ transitionDelay: isInView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
