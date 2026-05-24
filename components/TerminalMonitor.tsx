// Animated terminal mockup — types out scan lines and highlights a blocked merge in green.
// Shell uses dark green-black tones to match the AgentGuard enforcement theme.

"use client";

import { useEffect, useState } from "react";

const terminalLines = [
  {
    id: "line1",
    content: "$ Analyzing PR #47 — auth middleware changes",
    className: "break-words text-zinc-400",
    isBlocked: false,
  },
  {
    id: "line2",
    content: "  Scanning 847 lines across 6 files...",
    className: "break-words text-zinc-500",
    isBlocked: false,
  },
  {
    id: "line3",
    content: "  Policy check: authentication systems → MATCH",
    className: "break-words text-zinc-400",
    isBlocked: false,
  },
  {
    id: "line4",
    content: "  Risk classification: HIGH",
    className: "break-words text-zinc-500",
    isBlocked: false,
  },
  {
    id: "line5",
    content:
      "✓ BLOCKED — Authentication changes require manual approval before merge",
    className:
      "break-words border-l-2 border-[#5EE3A6] bg-[#0D2818] px-4 py-2 font-mono font-semibold text-[#5EE3A6] blocked-pulse",
    isBlocked: true,
  },
  {
    id: "line6",
    content:
      "Notification sent to repository owner. PR marked as blocked on GitHub.",
    className: "mt-2 break-words text-xs text-zinc-600",
    isBlocked: false,
  },
];

type TerminalMonitorProps = {
  active: boolean;
};

export function TerminalMonitor({ active }: TerminalMonitorProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Start the typing animation once the section scrolls into view.
  useEffect(() => {
    if (!active || hasStarted) return;
    setHasStarted(true);
  }, [active, hasStarted]);

  // Reveal one line at a time with a short delay between each.
  useEffect(() => {
    if (!hasStarted) return;
    if (visibleCount >= terminalLines.length) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((count) => count + 1);
    }, visibleCount === 0 ? 0 : 350);

    return () => window.clearTimeout(timer);
  }, [hasStarted, visibleCount]);

  const showCursor = visibleCount >= terminalLines.length;

  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-[#1A4D30] bg-[#010D05] font-mono text-sm">
      <div className="flex items-center gap-2 border-b border-[#1A4D30] bg-[#0D1F10] px-4 py-3">
        <div className="flex shrink-0 gap-1.5" aria-hidden="true">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: "#FF5F57" }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: "#FFBD2E" }}
          />
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: "#28CA41" }}
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs text-zinc-500">
          agentguard — live monitor
        </p>
      </div>
      <div className="space-y-2 overflow-hidden p-6 sm:p-8">
        {terminalLines.slice(0, visibleCount).map((line) => (
          <p key={line.id} className={line.className}>
            {line.content}
          </p>
        ))}
        {showCursor && (
          <span className="cursor-blink inline-block h-4 w-2 bg-zinc-500" />
        )}
      </div>
    </div>
  );
}
