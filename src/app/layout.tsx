import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/themes.css'
import { WalletContextProvider } from '../components/WalletProvider'

// Import SVG sprite for game icons
import IconSprite from '../assets/icons/game-items.svg'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PIR8 - Privacy-First Gaming',
  description: 'Fast battles, private moves, viral wins on Solana blockchain',
  keywords: ['pir8', 'solana', 'gaming', 'pirates', 'blockchain', 'privacy', 'web3'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900 min-h-screen`}>
        {/* Hidden SVG sprite for icons */}
        <div dangerouslySetInnerHTML={{ __html: IconSprite }} style={{ display: 'none' }} />
        
        <WalletContextProvider>
          <div className="min-h-screen bg-gradient-to-br from-ocean-blue via-blue-900 to-slate-900 text-white">
            {children}
          </div>
        </WalletContextProvider>
      </body>
    </html>
  )
}