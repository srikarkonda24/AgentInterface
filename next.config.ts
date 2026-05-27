import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Cloudflare tunnel domain to make requests to this
  // Next.js dev server. Without this, Next.js 15 may misroute
  // requests coming through the tunnel to the page router instead
  // of the API route handler.
  allowedDevOrigins: [
    "solutions-rap-roll-performance.trycloudflare.com",
  ],
};

export default nextConfig;
