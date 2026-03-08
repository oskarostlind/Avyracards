/** @type {import('next').NextConfig} */
const nextConfig = {
  // OBS: Ingen output: "standalone" här!

  // --- NYTT: Tillåt bilder från Vercel Blob ---
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wvedwsixof0ojo8s.public.blob.vercel-storage.com",
        port: "",
      },
    ],
  },

  experimental: {
    // Detta löser problemet med Wallet-generatorn och Prisma
    serverComponentsExternalPackages: ['passkit-generator', '@prisma/client', 'bcryptjs'],
    
    serverActions: {
      allowedOrigins: ["localhost:3000", "avyracards.se"]
    }
  },

  // Vi kan behöva denna för att säkerställa att Node-moduler hanteras rätt
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

export default nextConfig;