/** @type {import('next').NextConfig} */
const nextConfig = {
  // STATIC EXPORT - No server-side rendering, pure client-side app
  output: 'export',
  
  env: {
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL || '',
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  },
  images: {
    unoptimized: true, // Required for static export
  },
  compress: true,
  
  // Disable features that require server
  trailingSlash: true,
}

module.exports = nextConfig
