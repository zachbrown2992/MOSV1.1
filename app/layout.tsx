import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MOS — Marketing Operating System',
  description: 'B2B SaaS marketing intelligence and diagnostic system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
