/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com"
      }
    ]
  },
  output: 'export'
  // output: 'standalone' // for docker deployment
};

export default nextConfig;
