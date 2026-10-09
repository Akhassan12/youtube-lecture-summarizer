/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,  // ✅ Ensures App Router is enabled
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
