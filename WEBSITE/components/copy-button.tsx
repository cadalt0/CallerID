"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { animationConfig } from "@/lib/animations"

interface CopyButtonProps {
  text: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function CopyButton({ text, className = "", size = "md" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size]

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className={`rounded ${className}`} title="Copy to clipboard">
      {copied ? (
        <Check
          className={`${sizeClass} text-accent`}
          style={{
            animation: `pulse 600ms ${animationConfig.easing.smooth} 1`,
          }}
        />
      ) : (
        <Copy className={sizeClass} />
      )}
    </Button>
  )
}
