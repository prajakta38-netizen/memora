import type { Metadata } from 'next'
import './globals.css'

// ✅ Import the console disabler
import '@/lib/disable-console'

export const metadata: Metadata = {
  title: 'Memora',
  description: 'Upload and share video memories',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}