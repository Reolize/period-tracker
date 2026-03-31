"use client"

import { useEffect, useState } from "react"
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react"

export type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message: string
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; colors: string }> = {
  success: {
    icon: CheckCircle,
    colors: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  error: {
    icon: XCircle,
    colors: "bg-red-50 border-red-200 text-red-800",
  },
  warning: {
    icon: AlertTriangle,
    colors: "bg-amber-50 border-amber-200 text-amber-800",
  },
  info: {
    icon: Info,
    colors: "bg-blue-50 border-blue-200 text-blue-800",
  },
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type]
        const Icon = config.icon

        return (
          <ToastItem
            key={toast.id}
            toast={toast}
            config={config}
            Icon={Icon}
            onRemove={onRemove}
          />
        )
      })}
    </div>
  )
}

function ToastItem({
  toast,
  config,
  Icon,
  onRemove,
}: {
  toast: Toast
  config: { icon: typeof CheckCircle; colors: string }
  Icon: typeof CheckCircle
  onRemove: (id: string) => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10)
    
    // Auto remove after 5 seconds
    const exitTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(toast.id), 300) // Remove after exit animation
    }, 5000)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(exitTimer)
    }
  }, [toast.id, onRemove])

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm
        transition-all duration-300 transform
        ${config.colors}
        ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
      `}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.title}</p>
        <p className="text-sm opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onRemove(toast.id), 300)
        }}
        className="shrink-0 p-1 hover:bg-black/5 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook for using toast
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, title, message }])
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast,
    // Convenience methods
    success: (title: string, message: string) => addToast("success", title, message),
    error: (title: string, message: string) => addToast("error", title, message),
    warning: (title: string, message: string) => addToast("warning", title, message),
    info: (title: string, message: string) => addToast("info", title, message),
  }
}
