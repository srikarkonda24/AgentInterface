// Enforcement demo section — heading plus animated terminal that shows a blocked PR.
// Terminal styling lives in TerminalMonitor; this file only handles layout and scroll trigger.

"use client";

import { useInView } from "@/hooks/useInView";
import { AnimateIn } from "./AnimateIn";
import { SectionLabel } from "./Hero";
import { TerminalMonitor } from "./TerminalMonitor";

export function EnforcementDemo() {
  const { ref, isInView } = useInView();

  return (
    <section className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <SectionLabel label="LIVE ENFORCEMENT" />
        </AnimateIn>
        <AnimateIn delayMs={50}>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Watch it catch a violation.
          </h2>
        </AnimateIn>
        <AnimateIn delayMs={100}>
          <p className="mt-4 max-w-2xl font-light text-zinc-500">
            This runs automatically on every AI-generated pull request. No manual
            review needed.
          </p>
        </AnimateIn>
        <div ref={ref}>
          <AnimateIn delayMs={200} className="mt-12">
            <TerminalMonitor active={isInView} />
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
