/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com"
      }
    ]
  },
  output: 'export',
  // Only apply basePath in production
  basePath: process.env.NODE_ENV === 'production' ? '/WallUCalculator' : '',
  trailingSlash: true
};

export default nextConfig;
