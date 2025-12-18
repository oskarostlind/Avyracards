/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // <--- Denna rad löser Vercel-felet
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "avyracards.se"]
    }
  }
};

export default nextConfig;