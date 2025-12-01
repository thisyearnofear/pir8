import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/themes.css'
import { WalletContextProvider } from '../components/WalletProvider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'PIR8 - Privacy-First Gaming',
  description: 'Fast battles, private moves, viral wins on Solana blockchain',
  keywords: ['pir8', 'solana', 'gaming', 'pirates', 'blockchain', 'privacy', 'web3'],
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5, user-scalable=yes',
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
          <div className="min-h-screen bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900 text-white">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  )
}