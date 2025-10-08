/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // ⚠️ IMPORTANT: Required for Docker deployment
  // This creates a standalone output for production
  output: "standalone",

  // API proxy configuration (optional)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:4000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
