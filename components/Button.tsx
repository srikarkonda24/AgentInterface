// Shared button component for AgentGuard. Renders an anchor tag styled as a button.
// Three variants: primary (white fill), secondary (outlined), cta (bright green fill).

import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "cta";

type ButtonProps = {
  variant: ButtonVariant;
  href: string;
  children: ReactNode;
  ariaLabel?: string;
};

// Each variant maps to a complete set of Tailwind classes.
// cta is the only bright element on the page — bright green on dark navy.
// primary hover glow uses green to match the new palette.
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-white text-black px-6 py-3 border border-white hover:bg-zinc-200 hover:shadow-[0_0_24px_rgba(94,227,166,0.15)] focus-visible:ring-white",
  secondary:
    "bg-transparent text-white px-6 py-3 border border-zinc-700 hover:bg-zinc-900 focus-visible:ring-zinc-400",
  cta: "bg-[#5EE3A6] text-[#000212] font-semibold hover:bg-[#4DD196] border border-[#5EE3A6] focus-visible:ring-[#5EE3A6] px-8 py-4",
};

// ring-offset color matches the new navy-black background #000212
const focusStyles =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#000212]";

export function Button({ variant, href, children, ariaLabel }: ButtonProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${focusStyles} ${variantStyles[variant]}`}
    >
      {children}
    </a>
  );
}
