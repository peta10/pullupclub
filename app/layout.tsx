import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import ChatbaseProvider from '@/components/Chatbase/ChatbaseProvider'

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic'
export const revalidate = 0

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    template: '%s | Pull-Up Club',
    default: 'Pull-Up Club - Elite Fitness Competition'
  },
  description: 'Join the ultimate pull-up competition. Compete monthly, earn rewards, and prove your strength in our elite fitness community.',
  keywords: 'pull-up, fitness, competition, workout, strength training, elite fitness, monthly competition',
  authors: [{ name: 'Pull-Up Club' }],
  creator: 'Pull-Up Club',
  publisher: 'Pull-Up Club',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://pullupclub.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Pull-Up Club',
    title: 'Pull-Up Club - Elite Fitness Competition',
    description: 'Join the ultimate pull-up competition. Compete monthly, earn rewards, and prove your strength in our elite fitness community.',
    images: [
      {
        url: '/pullup_header.webp',
        width: 1200,
        height: 630,
        alt: 'Pull-Up Club - Elite Fitness Competition'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pull-Up Club - Elite Fitness Competition',
    description: 'Join the ultimate pull-up competition. Compete monthly, earn rewards, and prove your strength in our elite fitness community.',
    images: ['/pullup_header.webp']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#9b9b6f' }
    ]
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.stripe.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="dns-prefetch" href="https://supabase.co" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="msapplication-navbutton-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />

      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <ChatbaseProvider />
        </Providers>
      </body>
    </html>
  )
}