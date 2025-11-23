"use client"

import type React from "react"

import { useState } from "react"
import { useAnimation } from "./animation-provider"
import { animationConfig } from "@/lib/animations"

interface HoverLiftProps {
  children: React.ReactNode
  className?: string
  liftAmount?: number
}

export function HoverLift({ children, className = "", liftAmount = 4 }: HoverLiftProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { prefersReducedMotion } = useAnimation()

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: prefersReducedMotion ? "none" : isHovered ? `translateY(-${liftAmount}px)` : "translateY(0)",
        transition: prefersReducedMotion
          ? "none"
          : `transform ${animationConfig.duration.short}ms ${animationConfig.easing.standard}`,
      }}
    >
      {children}
    </div>
  )
}
