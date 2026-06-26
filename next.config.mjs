/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static SPA: client-side data (lib/storage + lib/api), no server runtime.
  output: 'export',
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
