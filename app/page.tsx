// Home page for AgentGuard marketing site.
// Composes all landing sections in order — no logic, no data fetching.

import { Cta } from "@/components/Cta";
import { EnforcementDemo } from "@/components/EnforcementDemo";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Integrations } from "@/components/Integrations";
import { Problem } from "@/components/Problem";
import { SectionDivider } from "@/components/SectionDivider";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <Hero />
      <SectionDivider />
      <Problem />
      <SectionDivider />
      <HowItWorks />
      <SectionDivider />
      <EnforcementDemo />
      <SectionDivider />
      <Integrations />
      <SectionDivider />
      <Cta />
    </main>
  );
}
