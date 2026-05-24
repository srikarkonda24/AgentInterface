// Root layout for AgentGuard. Sets global font, navy-black background,
// mounts the sticky Nav, and provides shared metadata.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AgentGuard",
  description:
    "AgentGuard enforces safety policies and governance for AI coding agents across GitHub, Cursor, and Claude.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-[#000212] font-light text-white antialiased`}
      >
        <Nav />
        {children}
      </body>
    </html>
  );
}
