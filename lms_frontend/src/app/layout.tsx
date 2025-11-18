import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastContainer from '@/components/ui/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Edumentry',
  description: 'Modern AI-Integrated Learning Management System',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className={inter.className}
        suppressHydrationWarning={true}
      >
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
