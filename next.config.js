/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '',
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320,480, 640, 750, 828, 1080, 1200,1920, 2048,3840],
  },
  compress: true,
  staticPageGenerationTimeout: 120,
  async headers() {
    return [
      {
        // Byte arena embeds the spectator screen in an iframe. Allow only
        // the arena origin; everywhere else keeps the default (no framing).
        source: "/watch/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://app.bytearena.fun",
          },
        ],
      },
      {
        source: "/api/byte/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
  turbopack: {},
  
  // Webpack config to prevent Solana from being bundled server-side
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark Solana packages as external - don't bundle them
      config.externals = config.externals || [];
      config.externals.push({
        '@solana/web3.js': 'commonjs @solana/web3.js',
        '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
      });
    }
    return config;
  },
}

module.exports = nextConfig
