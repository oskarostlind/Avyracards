/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- OPTIMERING FÖR APPFLOW: Hoppa över kontroller vid build för att spara minne ---
  typescript: {
    // Ignorerar typ-fel vid bygge för att förhindra "Out of Memory"
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignorerar linting vid bygge för att spara RAM-minne
    ignoreDuringBuilds: true,
  },

  // --- Tillåt bilder från Vercel Blob (Från din originalkod) ---
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
    // Löser problem med Wallet-generatorn och Prisma (Från din originalkod)
    // `maxmind` läser .mmdb-filen från disk med fs — den ska köras som vanlig
    // Node-modul, inte buntas av webpack.
    serverComponentsExternalPackages: ['passkit-generator', '@prisma/client', 'bcryptjs', 'maxmind'],

    // Apple Wallet-routen läser ikon och logotyp från public/wallet vid körning
    // (fs.readFile med process.cwd()). Next kan inte spåra den sortens dynamiska
    // sökväg automatiskt, så filerna måste pekas ut explicit — annars riskerar
    // funktionen att sakna dem i produktionsbundlen och passet faller på ENOENT.
    outputFileTracingIncludes: {
      '/api/wallet/apple': ['./public/wallet/**'],

      // GeoLite2-databasen (~70 MB) läses vid körning med en sökväg byggd av
      // process.cwd(), som Next inte kan spåra automatiskt. Den pekas ut BARA
      // för analytics-routen — Vercels gräns på 250 MB uppackat per funktion
      // klarar den lätt en gång, men inte om filen följer med varje route.
      // Saknas filen degraderar src/lib/analytics/geo.ts tyst.
      '/api/analytics': ['./geodata/**'],
    },

    serverActions: {
      allowedOrigins: ["localhost:3000", "avyracards.se"]
    }
  },

  // Säkerställer att Node-moduler hanteras rätt (Från din originalkod)
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    return config
  },
};

export default nextConfig;