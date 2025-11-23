"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useAnimation } from "./animation-provider"
import { animationConfig } from "@/lib/animations"

interface ScrollFadeProps {
  children: React.ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
}

export function ScrollFade({ children, delay = 0, direction = "up", className = "" }: ScrollFadeProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const { prefersReducedMotion } = useAnimation()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1 },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [delay])

  const getTransform = () => {
    if (prefersReducedMotion || isVisible) return "translate(0, 0)"
    switch (direction) {
      case "up":
        return "translateY(20px)"
      case "down":
        return "translateY(-20px)"
      case "left":
        return "translateX(20px)"
      case "right":
        return "translateX(-20px)"
      default:
        return "translate(0, 0)"
    }
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: prefersReducedMotion ? 1 : isVisible ? 1 : 0,
        transform: getTransform(),
        transition: prefersReducedMotion
          ? "none"
          : `opacity ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth}, transform ${animationConfig.duration.medium}ms ${animationConfig.easing.smooth}`,
      }}
    >
      {children}
    </div>
  )
}
