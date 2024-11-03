/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  basePath: process.env.GITHUB_PAGES ? '/WallUCalculator' : '',
  // This is important for GitHub Pages deployment
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com"
      }
    ]
  }
};

export default nextConfig;