/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static SPA: client-side data (lib/storage + lib/api), no server runtime.
  output: 'export',
  // Lint runs as a separate `bun run lint` step (and in CI); don't block the deploy build on it.
  eslint: { ignoreDuringBuilds: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com"
      }
    ]
  },
  // Only apply basePath in production
  basePath: process.env.NODE_ENV === 'production' ? '/WallUCalculator' : '',
  trailingSlash: true
};

export default nextConfig;
