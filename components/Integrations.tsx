// Integrations section — shows supported tools as green-accent pill badges.
// Badges animate in on scroll; hover state highlights border and text in green.

"use client";

import { useInView } from "@/hooks/useInView";
import { AnimateIn } from "./AnimateIn";
import { SectionLabel } from "./Hero";

const integrations = ["GitHub", "Cursor", "Claude", "Copilot"];

export function Integrations() {
  const { ref, isInView } = useInView();

  return (
    <section className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl text-center">
        <AnimateIn>
          <div className="flex justify-center">
            <SectionLabel label="INTEGRATIONS" />
          </div>
        </AnimateIn>
        <AnimateIn delayMs={50}>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Already where your code lives.
          </h2>
        </AnimateIn>
        <div
          ref={ref}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          {integrations.map((name, index) => (
            <span
              key={name}
              className={`reveal-transition rounded-full border border-[#1A4D30] bg-[#0D2818]/40 px-5 py-2 text-sm text-zinc-300 transition-all duration-200 hover:scale-105 hover:border-[#5EE3A6] hover:text-[#5EE3A6] ${
                isInView ? "reveal-visible" : "reveal-hidden"
              }`}
              style={{
                transitionDelay: isInView ? `${index * 60}ms` : "0ms",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
