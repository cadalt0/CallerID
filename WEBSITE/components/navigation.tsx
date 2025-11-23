"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { WalletConnect } from "@/components/wallet-connect"
import Image from "next/image"

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Image 
              src="/setting.png" 
              alt="CallerID Logo" 
              width={24}
              height={24}
              className="group-hover:scale-110 transition"
            />
            <span className="font-bold text-lg">CallerID</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "/how-it-works", label: "How It Works" },
              { href: "/features", label: "Features" },
              { href: "/faq", label: "FAQ" },
              { href: "/docs", label: "Docs" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition ${
                  isActive(link.href) ? "text-primary font-semibold" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="scale-90 sm:scale-100">
              <WalletConnect />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
