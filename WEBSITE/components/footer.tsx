import Link from "next/link"
import { Lock } from "lucide-react"
import { Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <span className="font-bold">CallerID</span>
            </Link>
            <p className="text-sm text-foreground/60">A privacy-first decentralized phonebook you can trust.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-foreground/60 hover:text-foreground transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-foreground/60 hover:text-foreground transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/demo" className="text-foreground/60 hover:text-foreground transition">
                  Try Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/docs" className="text-foreground/60 hover:text-foreground transition">
                  Developer Docs
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-foreground/60 hover:text-foreground transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-foreground/60 hover:text-foreground transition">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-sm">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="text-foreground/60 hover:text-foreground transition">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <p className="text-sm text-foreground/60 text-center">
            © 2025 CallerID. Privacy-first. Decentralized. Trustless.
          </p>
        </div>
      </div>
    </footer>
  )
}
