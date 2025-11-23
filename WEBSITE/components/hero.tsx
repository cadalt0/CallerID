"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAnimation } from "./animation-provider"
import { animationConfig } from "@/lib/animations"
import { useEffect, useState, Suspense } from "react"
import { EncryptedWord } from "./encrypted-word"
import { RotatingTrustWord } from "./rotating-trust-word"
import { GenerativeArtScene } from "@/components/ui/generative-art-scene"
import { Upload, AlertTriangle } from "lucide-react"

export default function Hero() {
  const { prefersReducedMotion } = useAnimation()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="min-h-[calc(100vh-64px)] flex items-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Three.js Animation on the right side - hidden on mobile, visible on larger screens */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[55%] xl:w-[50%] -z-0 opacity-40 overflow-hidden">
        <Suspense fallback={null}>
          <GenerativeArtScene />
        </Suspense>
      </div>

      {/* Content on the left side - full width on mobile, constrained on larger screens */}
      <div className="w-full lg:w-1/2 xl:w-3/5 max-w-2xl mx-auto lg:mx-0 lg:ml-[5%] xl:ml-[10%] text-center lg:text-left space-y-6 sm:space-y-8 relative z-10">
        <div className="space-y-4">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance"
            style={{
              opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
              transform: prefersReducedMotion ? "none" : isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: prefersReducedMotion
                ? "none"
                : `opacity ${animationConfig.duration.long}ms ${animationConfig.easing.smooth}, transform ${animationConfig.duration.long}ms ${animationConfig.easing.smooth}`,
            }}
          >
            A decentralized <EncryptedWord /> phonebook you can <RotatingTrustWord />.
          </h1>

          <div
            className="space-y-2"
            style={{
              opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
              transform: prefersReducedMotion ? "none" : isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: prefersReducedMotion
                ? "none"
                : `opacity ${animationConfig.duration.long}ms ${animationConfig.easing.smooth} 150ms, transform ${animationConfig.duration.long}ms ${animationConfig.easing.smooth} 150ms`,
              transitionProperty: "opacity, transform",
            }}
          >
            <p className="text-base sm:text-lg md:text-xl text-foreground/70 text-balance max-w-2xl mx-auto lg:mx-0">
              Share safely. Identify securely. Privacy you do not have to believe. You can verify it.
          </p>
            <p className="text-xs sm:text-sm text-foreground/60 text-balance max-w-2xl mx-auto lg:mx-0">
              Your data stays yours — not a product to be sold.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-full px-6 sm:px-8 w-full sm:w-auto transition-all"
            style={{
              opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
              transform: prefersReducedMotion ? "none" : isLoaded ? "scale(1)" : "scale(0.9)",
              transition: prefersReducedMotion
                ? "none"
                : `opacity ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 300ms, transform ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 300ms`,
            }}
          >
            <Link href="/demo">
              Try the Demo
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="rounded-full px-6 sm:px-8 w-full sm:w-auto transition-all"
            style={{
              opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
              transform: prefersReducedMotion ? "none" : isLoaded ? "scale(1)" : "scale(0.9)",
              transition: prefersReducedMotion
                ? "none"
                : `opacity ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 400ms, transform ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 400ms`,
            }}
          >
            <Link href="/upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Link>
          </Button>
            <Button
              asChild
              size="lg"
            variant="destructive"
            className="rounded-full px-6 sm:px-8 w-full sm:w-auto transition-all"
              style={{
                opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
                transform: prefersReducedMotion ? "none" : isLoaded ? "scale(1)" : "scale(0.9)",
                transition: prefersReducedMotion
                  ? "none"
                : `opacity ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 500ms, transform ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth} 500ms`,
              }}
            >
            <Link href="/spam">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report
              </Link>
            </Button>
        </div>

        <div className="pt-8 sm:pt-12">
          <div
            className="flex items-center justify-center lg:justify-start gap-1 sm:gap-1.5 text-xs sm:text-sm text-foreground/50"
            style={{
              opacity: prefersReducedMotion ? 1 : isLoaded ? 1 : 0,
              transition: prefersReducedMotion
                ? "none"
                : `opacity ${animationConfig.duration.long}ms ${animationConfig.easing.smooth} 600ms`,
            }}
          >
            <span>Built with</span>
            <span className="font-semibold">Nautilus</span>
            <span>,</span>
            <img src="/walrus.png" alt="Walrus" className="h-4 sm:h-5 w-auto mx-0.5" />
            <span className="font-semibold">Walrus</span>
            <span>on</span>
            <img src="/sui.png" alt="Sui" className="h-4 sm:h-5 w-auto mx-0.5" />
            <span className="font-semibold">Sui</span>
          </div>
        </div>
      </div>
    </section>
  )
}
