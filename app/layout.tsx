import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Top Note — Find Your Note',
  description: 'The fragrance discovery platform for people who take scent seriously.',
  openGraph: {
    title: 'Top Note',
    description: 'Find your note.',
    url: 'https://topnote.cloud',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
