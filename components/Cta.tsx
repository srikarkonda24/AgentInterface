// Final call-to-action section — two-tone headline, green glow, and bright green waitlist button.
// The cta button variant is the only fully bright element on the landing page.

"use client";

import { Button } from "./Button";
import { AnimateIn } from "./AnimateIn";

export function Cta() {
  return (
    <section className="relative px-6 pb-32 pt-24 sm:px-8 sm:pb-40 sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
        aria-hidden="true"
      >
        <div
          className="h-96 w-full max-w-3xl rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(94,227,166,0.04) 0%, transparent 70%)",
          }}
        />
      </div>
      <div className="relative mx-auto max-w-6xl text-center">
        <AnimateIn>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {/* Two-tone headline — white lead phrase, zinc-400 closing phrase */}
            <span className="text-white">The infrastructure for AI-assisted </span>
            <span className="text-zinc-400">development is here.</span>
          </h2>
        </AnimateIn>
        <AnimateIn delayMs={100}>
          <p className="mt-4 font-light text-zinc-500">
            Join the teams getting early access to AgentGuard before public
            launch.
          </p>
        </AnimateIn>
        <AnimateIn delayMs={300}>
          <div className="mt-10">
            <Button variant="cta" href="#">
              Join the Waitlist
            </Button>
          </div>
        </AnimateIn>
        <AnimateIn delayMs={400}>
          <p className="mt-6 text-sm text-zinc-600">
            Free during early access. No credit card required.
          </p>
        </AnimateIn>
      </div>
    </section>
  );
}
