/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "avyracards.se"]
    }
  }
};

export default nextConfig;
