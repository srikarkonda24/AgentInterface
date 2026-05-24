// Sticky top navigation bar for AgentGuard landing page.
// Purely static — no auth, no logic, no state.

export function Nav() {
  return (
    <nav
      className="sticky top-0 z-50 border-b border-[#1A4D30]/50 bg-[#000212]/90 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        {/* Wordmark — ⬡ icon + product name */}
        <div className="flex items-center gap-2">
          <span className="text-[#5EE3A6]" aria-hidden="true">
            ⬡
          </span>
          <span className="text-sm font-semibold text-white">AgentGuard</span>
        </div>

        {/* Join Waitlist — outline green on rest, fills on hover */}
        <a
          href="#"
          className="rounded-lg border border-[#5EE3A6] px-4 py-1.5 text-sm font-medium text-[#5EE3A6] transition-colors duration-200 hover:bg-[#5EE3A6] hover:text-[#000212]"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}
