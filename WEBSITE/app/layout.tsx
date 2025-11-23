import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "@mysten/dapp-kit/dist/index.css"
import { AnimationProvider } from "@/components/animation-provider"
import { ToastContainer } from "@/components/toast-notification"
import { ErrorBoundary } from "@/components/error-boundary"
import { WalletProviderWrapper } from "@/components/wallet-provider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  // updated metadata for privacy phonebook website
  title: "CallerID - Decentralized Phonebook You Can Trust",
  description:
    "A privacy-first, decentralized phonebook network that helps identify unknown callers without exposing your contact list. Zero tracking. End-to-end encrypted.",
  generator: "CallerID",
  icons: {
    icon: [
      {
        url: "/setting.png",
      },
      {
        url: "/setting.png",
        type: "image/png",
      },
    ],
    apple: "/setting.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary>
          <WalletProviderWrapper>
          <AnimationProvider>
            {children}
            <ToastContainer />
          </AnimationProvider>
          </WalletProviderWrapper>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
