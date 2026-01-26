import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sprite Sheet Creator',
  description: 'Create pixel art sprite sheets using fal.ai',
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
