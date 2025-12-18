/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vi tar bort output: "standalone" - Vercel sköter detta automatiskt
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "avyracards.se"]
    }
  }
};

export default nextConfig;