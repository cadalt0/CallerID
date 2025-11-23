"use client"

import { Component, type ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error("Error caught by boundary:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="p-8 max-w-md bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <h1 className="text-xl font-bold">Something went wrong</h1>
            </div>
            <p className="text-foreground/70 mb-6">
              We encountered an error. Please try refreshing the page or contact support.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="bg-background p-3 rounded text-xs overflow-auto mb-4 text-destructive">
                {this.state.error.toString()}
              </pre>
            )}
            <Button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              className="w-full rounded-full"
            >
              Retry
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
