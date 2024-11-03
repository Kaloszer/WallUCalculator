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
  // Add basePath if deploying to a subdirectory
  basePath: '/WallUCalculator',
  // This ensures proper static export
  trailingSlash: true
};

export default nextConfig;
