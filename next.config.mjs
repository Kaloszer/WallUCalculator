/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/WallUCalculator',
  experimental: {
    images: {
      unoptimized: true,
      remotePatterns: [
        {
          protocol: "https",
          hostname: "ui.shadcn.com"
        }
      ]
    }
  },
  output: 'export'
  // output: 'standalone' // for docker deployment
};

export default nextConfig;
