/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/WallUCalculator',
  images: {
    unoptimized: true,
  },
  output: 'export',
  reactStrictMode: true,
  // output: 'standalone' // for docker deployment
};

export default nextConfig;
