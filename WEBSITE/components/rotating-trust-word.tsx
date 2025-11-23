"use client"

import { useEffect, useState, useRef } from "react"

/**
 * RotatingTrustWord Component
 * 
 * Rotates between "verify", "proof", and "trust" with encryption animation
 */
export function RotatingTrustWord() {
  const words = ["verify", "proof", "trust"]
  const [displayText, setDisplayText] = useState(words[0])
  const [isEncrypting, setIsEncrypting] = useState(false)
  const currentWordIndexRef = useRef(0)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Characters that look encrypted (more symbols/numbers to avoid forming words)
  const encryptedChars = "0123456789ABCDEF+/=*&%$#@!~`"

  useEffect(() => {
    const animateWordChange = () => {
      setIsEncrypting(true)
      
      const currentWord = words[currentWordIndexRef.current]
      const nextWordIndex = (currentWordIndexRef.current + 1) % words.length
      const nextWord = words[nextWordIndex]
      const maxLength = Math.max(currentWord.length, nextWord.length)
      
      let charIndex = 0
      
      // Encrypt current word character by character
      const encryptInterval = setInterval(() => {
        if (charIndex < currentWord.length) {
          const encrypted = currentWord
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
          
          // Immediately start decrypting to next word (no pause, continuous transition)
          currentWordIndexRef.current = nextWordIndex
          
          // Start decrypting immediately without showing fully encrypted text
          let decryptIndex = 0
          const decryptInterval = setInterval(() => {
            if (decryptIndex < nextWord.length) {
              // Show partially decrypted word with encrypted chars for remaining positions
              const decrypted = nextWord
                .split("")
                .map((char, idx) => {
                  if (idx < decryptIndex) {
                    return char
                  }
                  // Use encrypted chars for remaining positions
                  return encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
                })
                .join("")
              setDisplayText(decrypted)
              decryptIndex++
            } else {
              clearInterval(decryptInterval)
              // Ensure final word is set correctly
              setDisplayText(nextWord)
              setIsEncrypting(false)
            }
          }, 50) // Decryption speed
        }
      }, 70) // Encryption speed
    }

    // Start animation after initial delay
    const initialTimeout = setTimeout(() => {
      animateWordChange()
    }, 2000)

    // Loop every 6 seconds (each word stays longer before animation starts)
    animationIntervalRef.current = setInterval(() => {
      animateWordChange()
    }, 6000)

    return () => {
      clearTimeout(initialTimeout)
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current)
      }
    }
  }, [])

  // Calculate min width based on longest word
  const maxLength = Math.max(...words.map(w => w.length))

  return (
    <span 
      className="inline-block relative" 
      style={{ 
        minWidth: `${maxLength}ch`, 
        display: "inline-block",
        fontFamily: "monospace",
        letterSpacing: "0.05em",
      }}
    >
      <span
        className={`transition-colors duration-150 ${
          isEncrypting ? "text-primary" : ""
        }`}
      >
        {displayText}
      </span>
    </span>
  )
}

