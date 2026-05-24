// Problem section — three cards describing risks of ungoverned AI-generated code.
// Uses SectionLabel from Hero and green-accent card styling from the Linear redesign.

"use client";

import { AnimateIn } from "./AnimateIn";
import { SectionLabel } from "./Hero";

const cards = [
  {
    title: "No Security Review",
    description:
      "AI tools introduce exposed secrets, injection vulnerabilities, and dangerous functions that go straight to production unreviewed.",
  },
  {
    title: "No Breaking Change Detection",
    description:
      "AI deletes functions, changes APIs, and removes error handling without knowing what else depends on them.",
  },
  {
    title: "No Audit Trail",
    description:
      "When something breaks you have no record of what the AI changed, why it changed it, or which tool wrote it.",
  },
];

export function Problem() {
  return (
    <section className="px-6 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-6xl">
        <AnimateIn>
          <SectionLabel label="THE PROBLEM" />
        </AnimateIn>
        <AnimateIn delayMs={50}>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            AI writes the code. Nobody governs it.
          </h2>
        </AnimateIn>
        <AnimateIn delayMs={100}>
          <p className="mt-4 max-w-2xl text-lg font-light text-zinc-500">
            Every team shipping with AI is flying blind in the same three ways.
          </p>
        </AnimateIn>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {cards.map((card, index) => (
            <AnimateIn key={card.title} delayMs={index * 150}>
              <div className="h-full rounded-xl border border-[#1A4D30] bg-zinc-950 p-6">
                <div
                  className="h-2 w-2 rounded-full bg-[#5EE3A6]"
                  aria-hidden="true"
                />
                <h3 className="mt-4 font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm font-light text-zinc-400">
                  {card.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
