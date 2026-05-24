// Animated horizontal rule that draws in from left when scrolled into view.
// Uses dark green border color to match the AgentGuard green palette.

"use client";

import { useInView } from "@/hooks/useInView";

export function SectionDivider() {
  const { ref, isInView } = useInView({ threshold: 0.5 });

  return (
    <div ref={ref} className="mx-auto max-w-6xl px-6 sm:px-8">
      <div
        className={`divider-transition h-px origin-left bg-[#1A4D30]/60 ${isInView ? "scale-x-100" : "scale-x-0"}`}
      />
    </div>
  );
}
