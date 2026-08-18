import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Memora - Upload & Share Videos',
  description: 'Upload a video, get a link, share it with anyone',
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