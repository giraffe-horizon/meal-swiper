import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meal Swiper - Planowanie posiłków',
  description: 'Aplikacja do planowania posiłków na tydzień w stylu Tinder',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Meal Swiper',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export const viewport: Viewport = {
  themeColor: '#10B981',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <head />
      <body>
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.debug('Service Worker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.error('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "CLOUDFLARE_ANALYTICS_TOKEN"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
