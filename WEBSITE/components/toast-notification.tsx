"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { animationConfig } from "@/lib/animations"

export type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toastContext: { toasts: Toast[]; listeners: Set<Function> } = {
  toasts: [],
  listeners: new Set(),
}

export function useToast() {
  const [, setUpdate] = useState({})

  const addToast = (message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString()
    const toast: Toast = { id, message, type, duration }

    toastContext.toasts = [...toastContext.toasts, toast]
    toastContext.listeners.forEach((l) => l())

    if (duration > 0) {
      setTimeout(() => {
        toastContext.toasts = toastContext.toasts.filter((t) => t.id !== id)
        toastContext.listeners.forEach((l) => l())
      }, duration)
    }

    return id
  }

  useEffect(() => {
    const listener = () => setUpdate({})
    toastContext.listeners.add(listener)
    return () => toastContext.listeners.delete(listener)
  }, [])

  return { addToast }
}

type ToastContainerProps = {}

export function ToastContainer({}: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = () => setToasts([...toastContext.toasts])
    toastContext.listeners.add(listener)
    return () => toastContext.listeners.delete(listener)
  }, [])

  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "bg-accent/10 border-accent/20 text-accent"
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive"
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-600"
      default:
        return "bg-primary/10 border-primary/20 text-primary"
    }
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-3 pointer-events-none max-w-sm">
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          className={`p-4 rounded border flex items-center gap-3 pointer-events-auto ${getBackgroundColor(toast.type)}`}
          style={{
            animation: `slideInUp 300ms ${animationConfig.easing.smooth} forwards`,
            animationDelay: `${idx * 50}ms`,
          }}
        >
          <p className="text-sm flex-1">{toast.message}</p>
          <button
            onClick={() => {
              toastContext.toasts = toastContext.toasts.filter((t) => t.id !== toast.id)
              toastContext.listeners.forEach((l) => l())
            }}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4 opacity-50 hover:opacity-100" />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
