"use client"

import { useEffect, useState } from "react"

/**
 * EncryptedWord Component
 * 
 * An animated word that continuously encrypts and decrypts itself,
 * creating a visual effect that emphasizes encryption.
 */
export function EncryptedWord() {
  const [displayText, setDisplayText] = useState("encrypted")
  const [isEncrypting, setIsEncrypting] = useState(false)

  // Characters that look encrypted (base64-like)
  const encryptedChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

  useEffect(() => {
    const animateEncryption = () => {
      setIsEncrypting(true)
      
      // Gradually encrypt each character
      const originalWord = "encrypted"
      let charIndex = 0
      
      const encryptInterval = setInterval(() => {
        if (charIndex < originalWord.length) {
          // Replace characters one by one with encrypted chars
          const encrypted = originalWord
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
          for (let i = 0; i < originalWord.length; i++) {
            fullyEncrypted += encryptedChars[Math.floor(Math.random() * encryptedChars.length)]
          }
          setDisplayText(fullyEncrypted)
          
          // After showing encrypted, decrypt back
          setTimeout(() => {
            let decryptIndex = 0
            const decryptInterval = setInterval(() => {
              if (decryptIndex < originalWord.length) {
                const decrypted = originalWord
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
                setDisplayText(originalWord)
                setIsEncrypting(false)
              }
            }, 50)
          }, 1500)
        }
      }, 80)
    }

    // Start animation after initial delay
    const initialTimeout = setTimeout(() => {
      animateEncryption()
    }, 2000)

    // Loop every 6 seconds
    const loopInterval = setInterval(() => {
      animateEncryption()
    }, 6000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(loopInterval)
    }
  }, [])

  return (
    <span 
      className="inline-block relative" 
      style={{ 
        minWidth: "9ch", 
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

