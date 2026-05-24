// Hero section for AgentGuard landing page.
// Also defines and exports SectionLabel — a small green tag used above every
// section title. Keeping it here avoids a new file; all sections import from here.

"use client";

import { Button } from "./Button";

// SectionLabel is exported so Problem, HowItWorks, EnforcementDemo, and
// Integrations can all import it without creating a separate file.
type SectionLabelProps = {
  label: string;
};

export function SectionLabel({ label }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#5EE3A6]" aria-hidden="true">
        ⬡
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-[#5EE3A6]">
        {label}
      </span>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative px-6 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32">
      {/* Very subtle green radial glow — large radius, barely visible, creates depth */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-full max-w-5xl -translate-x-1/2"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(94,227,166,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Wordmark — sits above the section label in zinc-500 mono */}
        <p
          className="hero-fade-in font-mono text-sm text-zinc-500"
          style={{ animationDelay: "0ms" }}
        >
          AgentGuard
        </p>

        {/* Section label replaces the old blue pill badge */}
        <div className="hero-fade-in mt-3" style={{ animationDelay: "80ms" }}>
          <SectionLabel label="NOW IN EARLY ACCESS" />
        </div>

        {/* Editorial two-column grid on md+: headline + buttons left, description right.
            On mobile everything stacks left-aligned. */}
        <div className="mt-8 md:grid md:grid-cols-2 md:items-start md:gap-16">
          {/* Left column: headline and buttons */}
          <div>
            <h1
              className="hero-fade-in text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "160ms" }}
            >
              {/* Two-tone effect: white phrase then zinc-400 phrase — no per-word spans */}
              <span className="text-white">Control AI-generated code </span>
              <span className="text-zinc-400">
                before it reaches production.
              </span>
            </h1>

            <div
              className="hero-fade-in mt-10 flex flex-col gap-4 sm:flex-row"
              style={{ animationDelay: "900ms" }}
            >
              {/* Outline green — hero-only style; matches Nav Join Waitlist button */}
              <a
                href="#"
                className="inline-flex items-center justify-center rounded-lg border border-[#5EE3A6] bg-transparent px-6 py-3 text-sm font-medium text-[#5EE3A6] transition-colors duration-200 hover:bg-[#5EE3A6] hover:text-[#000212] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE3A6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000212]"
              >
                Request Access
              </a>
              <Button variant="secondary" href="#">
                View Demo
              </Button>
            </div>

            <p
              className="hero-fade-in mt-8 text-sm text-zinc-600"
              style={{ animationDelay: "1100ms" }}
            >
              Built for developers using Cursor, Copilot, and Claude Code
            </p>
          </div>

          {/* Right column: description sits alongside the headline at the top */}
          <div
            className="hero-fade-in mt-8 md:mt-0"
            style={{ animationDelay: "400ms" }}
          >
            <p className="text-lg font-light text-zinc-400 sm:text-xl">
              AgentGuard watches every commit and pull request from AI coding
              tools. It catches security vulnerabilities, flags breaking changes,
              and blocks unsafe merges — automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
