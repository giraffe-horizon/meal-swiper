import type { Metadata } from 'next'
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
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
