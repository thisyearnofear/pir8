import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, IM_Fell_English } from 'next/font/google'
import './globals.css'
import '@/styles/design-tokens.css'
import '@/styles/MusicPlayer.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import { SafeWalletProvider } from '@/components/SafeWalletProvider'

// Three type registers — see DESIGN.md §3.
// interface / instrument / world
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-ui' })
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-instrument' })
const fell = IM_Fell_English({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-world',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b1418',
}

/**
 * A mark, not an emoji. Emoji-as-icon is banned by DESIGN.md §9 — it renders
 * differently on every platform and reads as a prototype.
 */
const MARK_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="10" fill="#0b1418"/>
      <path d="M32 12v40" stroke="#9a7b3f" stroke-width="2"/>
      <path d="M32 18c8-6 16 2 20 0v14c-4 2-12-6-20 0z" fill="#e8dfc8" opacity=".9"/>
      <path d="M14 46c6 4 12 4 18 0s12-4 18 0" stroke="#f0b24a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="32" cy="12" r="3" fill="#f0b24a"/>
    </svg>`,
  )

export const metadata: Metadata = {
  title: 'PIR8 — Private Naval Warfare',
  description: 'Turn-based naval tactics where your moves stay yours. Fast battles, private moves, viral wins on Solana.',
  keywords: ['pir8', 'solana', 'gaming', 'pirates', 'blockchain', 'privacy', 'web3'],
  icons: {
    icon: MARK_SVG,
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
    <html lang="en" className={`${inter.variable} ${mono.variable} ${fell.variable}`}>
      <head>
        <meta name="theme-color" content="#0b1418" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent noisy provider conflicts from crashing the app
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ethereum') || e.message.includes('Cannot set property'))) {
                  console.warn('Provider error suppressed:', e.message);
                  e.preventDefault();
                  return false;
                }
              });

              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && (e.reason.message.includes('ethereum') || e.reason.message.includes('Cannot set property'))) {
                  console.warn('Provider rejection suppressed:', e.reason.message);
                  e.preventDefault();
                  return false;
                }
              });
            `
          }}
        />
      </head>
      <body className={`${inter.className} bg-[var(--p8-ink)] text-[var(--p8-vellum)] min-h-screen safe-area-inset`}>
        <SafeWalletProvider>
          <div className="min-h-screen bg-[var(--p8-ink)] text-[var(--p8-vellum)]">
            {children}
          </div>
        </SafeWalletProvider>
      </body>
    </html>
  )
}
