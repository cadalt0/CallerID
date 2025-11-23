// Animation utilities and constants for smooth, purposeful motion

export const animationConfig = {
  easing: {
    // Custom cubic-bezier for entrance animations
    smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
    // Standard ease for transitions
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    // Gentle ease for micro-interactions
    gentle: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  },
  duration: {
    micro: 300,
    short: 600,
    medium: 800,
    long: 1200,
  },
}

export const getReducedMotion = () => {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export type AnimationPreference = "full" | "reduced"

export const getAnimationStyle = (duration: number, easing: string, preferReduced = false) => {
  if (preferReduced) {
    return {
      transition: "none",
      animation: "none",
    }
  }
  return {
    transition: `all ${duration}ms ${easing}`,
  }
}
