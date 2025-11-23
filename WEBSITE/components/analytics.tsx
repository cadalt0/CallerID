"use client"

import type React from "react"
import { useEffect } from "react"

interface PageView {
  page: string
  timestamp: number
}

interface Analytics {
  pageViews: PageView[]
  customEvents: Record<string, number>
}

const analyticsStore: {
  data: Analytics
  enabled: boolean
} = {
  data: {
    pageViews: [],
    customEvents: {},
  },
  enabled: true,
}

// Simple analytics utility functions
export const analytics = {
  trackPageView(page: string) {
    if (!analyticsStore.enabled) return

    analyticsStore.data.pageViews.push({
      page,
      timestamp: Date.now(),
    })

    // Send minimal telemetry (no PII)
    if (typeof window !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon("/api/analytics", JSON.stringify({ page }))
      } catch {
        // Analytics failure should not break app
      }
    }
  },

  trackEvent(event: string, properties?: Record<string, any>) {
    if (!analyticsStore.enabled) return

    analyticsStore.data.customEvents[event] = (analyticsStore.data.customEvents[event] || 0) + 1

    if (typeof window !== "undefined" && navigator.sendBeacon) {
      try {
        navigator.sendBeacon("/api/analytics", JSON.stringify({ event, properties }))
      } catch {
        // Analytics failure should not break app
      }
    }
  },

  setEnabled(enabled: boolean) {
    analyticsStore.enabled = enabled
  },

  getData() {
    return analyticsStore.data
  },
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Track initial page view
    if (typeof window !== "undefined") {
      analytics.trackPageView(window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const handleRouteChange = () => {
      analytics.trackPageView(window.location.pathname)
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => window.removeEventListener("popstate", handleRouteChange)
  }, [])

  return <>{children}</>
}
