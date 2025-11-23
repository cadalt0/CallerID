"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Home, ArrowLeft } from "lucide-react"

/**
 * FastEncryptedText Component
 * 
 * An animated text that continuously encrypts and decrypts itself very fast,
 * creating a visual effect similar to the hero's encrypted word but faster.
 */
function FastEncryptedText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text)
  const [isEncrypting, setIsEncrypting] = useState(false)

  // Characters that look encrypted (base64-like)
  const encryptedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

  useEffect(() => {
    const animateEncryption = () => {
      setIsEncrypting(true)
      
      // Gradually encrypt each character
      const originalText = text
      let charIndex = 0
      
      const encryptInterval = setInterval(() => {
        if (charIndex < originalText.length) {
          // Replace characters one by one with encrypted chars
          const encrypted = originalText
            .split("")
            .map((char, idx) => {
              if (idx <= charIndex) {
                return encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
              }
              return char
            })
            .join("")
          setDisplayText(encrypted)
          charIndex++
        } else {
          clearInterval(encryptInterval)
          
          // Show fully encrypted text
          let fullyEncrypted = ""
          for (let i = 0; i < originalText.length; i++) {
            fullyEncrypted += encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
          }
          setDisplayText(fullyEncrypted)
          
          // After showing encrypted, decrypt back (faster)
          setTimeout(() => {
            let decryptIndex = 0
            const decryptInterval = setInterval(() => {
              if (decryptIndex < originalText.length) {
                const decrypted = originalText
                  .split("")
                  .map((char, idx) => {
                    if (idx < decryptIndex) {
                      return char
                    }
                    return encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
                  })
                  .join("")
                setDisplayText(decrypted)
                decryptIndex++
              } else {
                clearInterval(decryptInterval)
                setDisplayText(originalText)
                setIsEncrypting(false)
              }
            }, 30) // Faster: 30ms instead of 50ms
          }, 800) // Shorter wait: 800ms instead of 1500ms
        }
      }, 40) // Faster: 40ms instead of 80ms
    }

    // Start animation immediately
    animateEncryption()

    // Loop every 3 seconds (faster than hero's 6 seconds)
    const loopInterval = setInterval(() => {
      animateEncryption()
    }, 3000)

    return () => {
      clearInterval(loopInterval)
    }
  }, [text])

  return (
    <span 
      className="inline-block relative" 
      style={{ 
        minWidth: `${text.length}ch`, 
        display: "inline-block",
        fontFamily: "monospace",
        letterSpacing: "0.05em",
      }}
    >
      <span
        className={`transition-colors duration-100 ${
          isEncrypting ? "text-primary" : ""
        }`}
      >
        {displayText}
      </span>
    </span>
  )
}

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute top-10 sm:top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 sm:bottom-20 right-4 sm:right-10 w-48 h-48 sm:w-72 sm:h-72 bg-accent/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold">
            <FastEncryptedText text="404" />
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
            <FastEncryptedText text="Not Found" />
          </h2>
        </div>

        <p className="text-base sm:text-lg text-foreground/70 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/upload">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Upload
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

