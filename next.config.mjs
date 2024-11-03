/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/WallUCalculator',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com"
      }
    ]
  },
  output: 'export',
  reactStrictMode: true,
  // output: 'standalone' // for docker deployment
};

export default nextConfig;
