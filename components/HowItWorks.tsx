// How It Works section — three-step walkthrough of the AgentGuard workflow.
// Uses green watermark numbers and a connecting line between steps on desktop.

"use client";

import { useInView } from "@/hooks/useInView";
import { AnimateIn } from "./AnimateIn";
import { SectionLabel } from "./Hero";

const steps = [
  {
    number: "01",
    title: "Install in 30 seconds",
    description:
      "Install the AgentGuard GitHub App on any repo. No code changes. No configuration.",
  },
  {
    number: "02",
    title: "AI activity is monitored automatically",
    description:
      "Every commit and PR from Cursor, Copilot, or Claude Code is scanned for security vulnerabilities and breaking changes in real time.",
  },
  {
    number: "03",
    title: "Problems are caught before they merge",
    description:
      "Critical issues block the merge automatically. A detailed comment explains exactly what was found and how to fix it.",
  },
];

export function HowItWorks() {
  const { ref, isInView } = useInView();

  return (
    <section className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <SectionLabel label="HOW IT WORKS" />
        </AnimateIn>
        <AnimateIn delayMs={50}>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            How AgentGuard works
          </h2>
        </AnimateIn>
        <AnimateIn delayMs={100}>
          <p className="mt-4 max-w-2xl font-light text-zinc-500">
            Three steps. Works with your existing GitHub workflow. No changes to
            how you code.
          </p>
        </AnimateIn>

        <div ref={ref} className="relative mt-16">
          <div
            className={`connector-transition absolute bottom-8 left-0 z-0 hidden h-px bg-[#1A4D30] md:block ${isInView ? "w-full" : "w-0"}`}
            aria-hidden="true"
          />
          <div className="relative z-10 grid gap-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <AnimateIn key={step.number} delayMs={index * 200}>
                <div className="relative overflow-hidden">
                  <span
                    className="pointer-events-none absolute left-0 top-0 z-0 select-none text-8xl font-bold leading-none text-[#0D2818]"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <div className="relative z-10 pt-16">
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm font-light text-zinc-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
