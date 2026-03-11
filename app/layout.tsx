import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'Meal Swiper - Planowanie posiłków',
  description: 'Aplikacja do planowania posiłków na tydzień w stylu Tinder',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "CLOUDFLARE_ANALYTICS_TOKEN"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
