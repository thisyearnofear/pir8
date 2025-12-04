import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/MusicPlayer.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { WalletContextProvider } from '@/components/WalletProvider'
import { ZcashBridgeInitializer } from '@/components/ZcashBridgeInitializer'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: 'PIR8 - Privacy-First Gaming',
  description: 'Fast battles, private moves, viral wins on Solana blockchain',
  keywords: ['pir8', 'solana', 'gaming', 'pirates', 'blockchain', 'privacy', 'web3'],
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">🏴‍☠️</text></svg>',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#006994" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900 min-h-screen safe-area-inset`}>
        <WalletContextProvider>
          <ZcashBridgeInitializer />
          <div className="min-h-screen bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900 text-white">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  )
}
