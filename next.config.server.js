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
  turbopack: {},
  // Webpack config to handle Solana packages
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      // Mark Solana packages as external to prevent server bundling
      config.externals.push({
        '@solana/web3.js': 'commonjs @solana/web3.js',
        '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
      });
    } else {
      // Client-side: provide fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    
    // Ignore node-specific modules warnings
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(fs|net|tls)$/,
      })
    );
    
    return config;
  },
}

module.exports = nextConfig
