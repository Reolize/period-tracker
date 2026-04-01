"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCircle2, Clock, ChevronRight, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { NotificationResponse, NotificationType } from "@/app/types/tracking"

// Notification type configurations with icons and colors
const NOTIFICATION_CONFIG: Record<NotificationType, { 
  icon: string
  color: string 
  bgColor: string
  label: string
}> = {
  reaction: { 
    icon: "🫂", 
    color: "text-pink-600", 
    bgColor: "bg-pink-100",
    label: "Community"
  },
  comment: { 
    icon: "💬", 
    color: "text-purple-600", 
    bgColor: "bg-purple-100",
    label: "Community"
  },
  cycle_prediction: { 
    icon: "📅", 
    color: "text-red-600", 
    bgColor: "bg-red-100",
    label: "Cycle"
  },
  symptom_alert: { 
    icon: "🩸", 
    color: "text-orange-600", 
    bgColor: "bg-orange-100",
    label: "Alert"
  },
  system: { 
    icon: "⚙️", 
    color: "text-blue-600", 
    bgColor: "bg-blue-100",
    label: "System"
  },
}

// Format timestamp
function formatTimestamp(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// Loading skeleton component
function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#f0e8ee]">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-full bg-[#f0e8ee] animate-pulse shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-[#f0e8ee] rounded animate-pulse w-3/4" />
          <div className="h-3 bg-[#f0e8ee] rounded animate-pulse w-full" />
          <div className="h-3 bg-[#f0e8ee] rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-[#fff0f6] flex items-center justify-center mb-4">
        <CheckCircle2 className="w-10 h-10 text-[#ff7eb6]" />
      </div>
      <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">You're all caught up!</h3>
      <p className="text-sm text-[#7d6b86] text-center max-w-xs">
        No new notifications. We'll let you know when something important happens.
      </p>
    </div>
  )
}

// Notification Card Component
function NotificationCard({
  notification,
  onClick,
}: {
  notification: NotificationResponse
  onClick: () => void
}) {
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.system
  const isUnread = !notification.is_read

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 ${
        isUnread 
          ? "bg-[#fff5f8] border-[#ff7eb6]/30 shadow-sm hover:bg-[#fff0f6]" 
          : "bg-white border-[#f0e8ee] hover:bg-[#faf6f8]"
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
          <span className="text-xl">{config.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                {config.label}
              </span>
              {isUnread && (
                <div className="w-2 h-2 rounded-full bg-[#ff7eb6]" />
              )}
            </div>
            <span className="text-xs text-[#b06a94] flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3" />
              {formatTimestamp(notification.created_at)}
            </span>
          </div>

          <h3 className={`font-semibold text-[#3f2b4d] mt-2 ${isUnread ? "text-[#3f2b4d]" : ""}`}>
            {notification.title}
          </h3>

          <p className="text-sm text-[#7d6b86] mt-1 line-clamp-2">
            {notification.message}
          </p>

          {notification.link && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-[#ff7eb6]">
              View details
              <ChevronRight className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// Main Page Component
export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [activeFilter, setActiveFilter] = useState<NotificationType | "all">("all")

  // Fetch notifications
  useEffect(() => {
    fetchNotifications()
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeFilter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const url = `/community/notifications?${activeFilter !== "all" ? `type=${activeFilter}&` : ""}per_page=50`
      const data = await apiFetch(url)
      if (data) {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
        setTotalCount(data.total)
      }
    } catch (err) {
      console.error("Failed to load notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  // Mark single notification as read and navigate
  const handleNotificationClick = async (notification: NotificationResponse) => {
    try {
      if (!notification.is_read) {
        await apiFetch(`/community/notifications/${notification.id}/read`, { 
          method: "PUT" 
        })
        
        // Update local state
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      // Navigate if link provided
      if (notification.link) {
        router.push(notification.link)
      }
    } catch (err) {
      console.error("Failed to handle notification:", err)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      await apiFetch("/community/notifications/read-all", { method: "PUT" })
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Filter notifications
  const filteredNotifications = activeFilter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter)

  const newNotifications = filteredNotifications.filter(n => !n.is_read)
  const earlierNotifications = filteredNotifications.filter(n => n.is_read)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5f8] via-white to-[#fef0f5]">
      {/* Header */}
      <div className="bg-white border-b border-[#f0e8ee] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-[#3f2b4d] flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#ff7eb6]" />
              Notifications
            </h1>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markingAllRead}
                className="text-sm text-[#ff7eb6] hover:text-[#e05896] font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {markingAllRead ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Marking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Mark all read
                  </>
                )}
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === "all"
                  ? "bg-[#ff7eb6] text-white shadow-sm"
                  : "bg-[#faf6f8] text-[#7d6b86] hover:bg-[#f0e8ee]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("reaction")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === "reaction"
                  ? "bg-pink-500 text-white shadow-sm"
                  : "bg-pink-50 text-pink-600 hover:bg-pink-100"
              }`}
            >
              <span>🫂</span> Reactions
            </button>
            <button
              onClick={() => setActiveFilter("comment")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === "comment"
                  ? "bg-purple-500 text-white shadow-sm"
                  : "bg-purple-50 text-purple-600 hover:bg-purple-100"
              }`}
            >
              <span>💬</span> Comments
            </button>
            <button
              onClick={() => setActiveFilter("cycle_prediction")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === "cycle_prediction"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <span>📅</span> Cycle
            </button>
            <button
              onClick={() => setActiveFilter("system")}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeFilter === "system"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-100"
              }`}
            >
              <span>⚙️</span> System
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          // Loading skeleton
          <div className="space-y-3">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* New Notifications */}
            {newNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#3f2b4d] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff7eb6] animate-pulse" />
                  New ({newNotifications.length})
                </h2>
                <div className="space-y-3">
                  {newNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Earlier Notifications */}
            {earlierNotifications.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[#7d6b86] uppercase tracking-wider mb-3">
                  Earlier
                </h2>
                <div className="space-y-3">
                  {earlierNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
