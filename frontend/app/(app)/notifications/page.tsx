"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Droplet, Sparkles, Bell, Mail, Settings, CheckCircle2, Clock, ChevronRight, Loader2, Trash2, X, AlertTriangle } from "lucide-react"
import { apiFetch } from "@/lib/api"

// Types matching backend schema
type NotificationType = "cycle" | "ai_insight" | "reminder" | "fertility"

interface Notification {
  id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  action_label?: string
  action_url?: string
  created_at: string
}

interface NotificationListResponse {
  notifications: Notification[]
  unread_count: number
  total_count: number
}

interface NotificationSettings {
  user_id: number
  period_predictions: boolean
  late_period: boolean
  fertile_window: boolean
  log_symptoms: boolean
  drink_water: boolean
  ai_patterns: boolean
}

// Clear All Confirmation Modal Component
function ClearAllModal({
  isOpen,
  onClose,
  onConfirm,
  isClearing,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isClearing: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-[#f0e8ee] w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-[#fff0f6] flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-[#ff7eb6]" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[#3f2b4d] text-center mb-2">
          Clear All Notifications?
        </h3>

        {/* Message */}
        <p className="text-sm text-[#7d6b86] text-center mb-6 leading-relaxed">
          Are you sure you want to clear all notifications? This action cannot be undone.
        </p>

        {/* Warning note */}
        <div className="flex items-start gap-2 bg-[#fff0f6] rounded-xl p-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-[#ff7eb6] shrink-0 mt-0.5" />
          <p className="text-xs text-[#b06a94]">
            Once cleared, you won&apos;t be able to recover these notifications.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-[#7d6b86] bg-[#faf6f8] hover:bg-[#f0e8ee] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-sm text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isClearing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Clear All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
function NotificationSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#f0e8ee]">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[#f0e8ee] animate-pulse shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-[#f0e8ee] rounded animate-pulse w-3/4" />
          <div className="h-3 bg-[#f0e8ee] rounded animate-pulse w-full" />
          <div className="h-3 bg-[#f0e8ee] rounded animate-pulse w-1/2" />
        </div>
      </div>
    </div>
  )
}

// Notification Card Component
function NotificationCard({
  notification,
  onAction,
  onDelete,
}: {
  notification: Notification
  onAction?: () => void
  onDelete?: () => void
}) {
  const getIcon = () => {
    switch (notification.type) {
      case "cycle":
      case "fertility":
        return (
          <div className="w-10 h-10 rounded-full bg-[#fff0f6] flex items-center justify-center shrink-0">
            <Droplet className="w-5 h-5 text-[#ff7eb6]" fill="currentColor" />
          </div>
        )
      case "ai_insight":
        return (
          <div className="w-10 h-10 rounded-full bg-[#f7f1ff] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-[#b06a94]" />
          </div>
        )
      case "reminder":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#f0f9ff] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-[#0369a1]" />
          </div>
        )
    }
  }

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
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

  return (
    <div
      className={`relative bg-white rounded-2xl p-4 border transition-all duration-200 group ${
        notification.is_read
          ? "border-[#f0e8ee] hover:bg-[#faf6f8]"
          : "border-[#ff7eb6]/30 bg-[#fff0f6]/30 hover:bg-[#fff0f6]/50 shadow-sm"
      }`}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-4 right-10 w-2 h-2 rounded-full bg-[#ff7eb6]" />
      )}

      {/* Delete button - appears on hover */}
      {onDelete && (
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[#b06a94]/50 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          aria-label="Delete notification"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="flex gap-3 pr-6">
        {getIcon()}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-semibold text-[#3f2b4d] ${!notification.is_read ? "text-[#3f2b4d]" : ""}`}>
              {notification.title}
            </h3>
          </div>

          <p className="text-sm text-[#7d6b86] mt-1 line-clamp-2">{notification.message}</p>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-[#b06a94] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(notification.created_at)}
            </span>

            {notification.action_label && (
              <button
                onClick={onAction}
                className="text-xs font-medium text-[#ff7eb6] hover:text-[#e05896] flex items-center gap-1 transition-colors"
              >
                {notification.action_label}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Toggle Switch Component
function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
  loading = false,
}: {
  enabled: boolean
  onChange: () => void
  label: string
  description: string
  loading?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[#3f2b4d]">{label}</h4>
        <p className="text-sm text-[#7d6b86] mt-0.5">{description}</p>
      </div>

      <button
        onClick={onChange}
        disabled={loading}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${
          enabled ? "bg-[#ff7eb6]" : "bg-[#e0d4f0]"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label={enabled ? `Disable ${label}` : `Enable ${label}`}
      >
        {loading ? (
          <Loader2 className="absolute top-1.5 left-1.5 w-4 h-4 text-white animate-spin" />
        ) : (
          <span
            className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        )}
      </button>
    </div>
  )
}

// Empty State Component
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

// Main Page Component
export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"inbox" | "settings">("inbox")

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [clearingAll, setClearingAll] = useState(false)
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false)

  // Settings state
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSetting, setSavingSetting] = useState<string | null>(null)

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoadingNotifications(true)
        const data: NotificationListResponse = await apiFetch("/notifications")
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count)
        setTotalCount(data.total_count)
      } catch (err) {
        console.error("Failed to load notifications:", err)
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [activeTab])

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true)
        const data: NotificationSettings = await apiFetch("/notifications/settings")
        setSettings(data)
      } catch (err) {
        console.error("Failed to load settings:", err)
      } finally {
        setLoadingSettings(false)
      }
    }

    if (activeTab === "settings") {
      fetchSettings()
    }
  }, [activeTab])

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAllRead(true)
      await apiFetch("/notifications/read-all", { method: "PUT" })
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    } finally {
      setMarkingAllRead(false)
    }
  }

  // Open clear all modal
  const handleClearAllClick = () => {
    setIsClearAllModalOpen(true)
  }

  // Clear all notifications
  const handleConfirmClearAll = async () => {
    try {
      setClearingAll(true)
      await apiFetch("/notifications/clear-all", { method: "DELETE" })
      // Update local state - remove all notifications
      setNotifications([])
      setUnreadCount(0)
      setTotalCount(0)
      setIsClearAllModalOpen(false)
    } catch (err) {
      console.error("Failed to clear all notifications:", err)
    } finally {
      setClearingAll(false)
    }
  }

  // Delete individual notification
  const handleDeleteNotification = async (notificationId: number) => {
    try {
      // Optimistic update - remove from UI immediately
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
      setTotalCount((prev) => Math.max(0, prev - 1))
      setUnreadCount((prev) => {
        const deleted = notifications.find((n) => n.id === notificationId)
        return deleted && !deleted.is_read ? Math.max(0, prev - 1) : prev
      })

      await apiFetch(`/notifications/${notificationId}`, { method: "DELETE" })
    } catch (err) {
      console.error("Failed to delete notification:", err)
      // Re-fetch on error to sync state
      const data: NotificationListResponse = await apiFetch("/notifications")
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
      setTotalCount(data.total_count)
    }
  }

  // Handle notification action click
  const handleNotificationAction = async (notification: Notification) => {
    try {
      // Mark as read
      if (!notification.is_read) {
        await apiFetch(`/notifications/${notification.id}/read`, { method: "PUT" })
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }

      // Navigate if action_url exists
      if (notification.action_url) {
        router.push(notification.action_url)
      }
    } catch (err) {
      console.error("Failed to handle notification action:", err)
    }
  }

  // Update settings
  const handleSettingChange = async (key: keyof NotificationSettings) => {
    if (!settings) return

    const newValue = !settings[key]

    try {
      setSavingSetting(key)
      // Optimistic update
      setSettings({ ...settings, [key]: newValue })

      await apiFetch("/notifications/settings", {
        method: "PUT",
        body: JSON.stringify({ [key]: newValue }),
      })
    } catch (err) {
      console.error("Failed to update setting:", err)
      // Revert on error
      setSettings({ ...settings, [key]: !newValue })
    } finally {
      setSavingSetting(null)
    }
  }

  const newNotifications = notifications.filter((n) => !n.is_read)
  const earlierNotifications = notifications.filter((n) => n.is_read)

  return (
    <div className="min-h-screen bg-[#fff7fb]">
      {/* Header */}
      <div className="bg-white border-b border-[#f0e8ee] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-[#3f2b4d] mb-4">Notifications</h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#faf6f8] rounded-xl p-1">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "inbox"
                  ? "bg-white text-[#ff7eb6] shadow-sm"
                  : "text-[#7d6b86] hover:text-[#3f2b4d]"
              }`}
            >
              <Mail className="w-4 h-4" />
              Inbox
              {newNotifications.length > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#ff7eb6] text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                activeTab === "settings"
                  ? "bg-white text-[#ff7eb6] shadow-sm"
                  : "text-[#7d6b86] hover:text-[#3f2b4d]"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === "inbox" ? (
          <div className="space-y-6 animate-fadeIn">
              {/* Mark all as read and Clear all buttons */}
              {(unreadCount > 0 || notifications.length > 0) && !loadingNotifications && (
                <div className="flex justify-end gap-3">
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
                        "Mark all as read"
                      )}
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAllClick}
                      disabled={clearingAll}
                      className="text-sm text-[#7d6b86] hover:text-red-500 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {clearingAll ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3" />
                          Clear All
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

            {loadingNotifications ? (
              // Loading skeleton
              <div className="space-y-3">
                <NotificationSkeleton />
                <NotificationSkeleton />
                <NotificationSkeleton />
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* New Notifications */}
                {newNotifications.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-[#3f2b4d] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ff7eb6]" />
                      New
                    </h2>
                    <div className="space-y-3">
                      {newNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onAction={() => handleNotificationAction(notification)}
                          onDelete={() => handleDeleteNotification(notification.id)}
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
                          onAction={() => handleNotificationAction(notification)}
                          onDelete={() => handleDeleteNotification(notification.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {loadingSettings || !settings ? (
              // Loading skeleton for settings
              <div className="bg-white rounded-2xl border border-[#f0e8ee] p-4">
                <div className="h-5 bg-[#f0e8ee] rounded animate-pulse w-1/3 mb-4" />
                <div className="space-y-4">
                  <div className="h-12 bg-[#f0e8ee] rounded animate-pulse" />
                  <div className="h-12 bg-[#f0e8ee] rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <>
                {/* Cycle Alerts */}
                <div className="bg-white rounded-2xl border border-[#f0e8ee] p-4">
                  <h2 className="font-semibold text-[#3f2b4d] mb-1 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-[#ff7eb6]" />
                    Cycle Alerts
                  </h2>
                  <div className="divide-y divide-[#f0e8ee]">
                    <ToggleSwitch
                      enabled={settings.period_predictions}
                      onChange={() => handleSettingChange("period_predictions")}
                      label="Period predictions"
                      description="Get notified when your period is approaching"
                      loading={savingSetting === "period_predictions"}
                    />
                    <ToggleSwitch
                      enabled={settings.late_period}
                      onChange={() => handleSettingChange("late_period")}
                      label="Late period"
                      description="Alert when your period is late"
                      loading={savingSetting === "late_period"}
                    />
                  </div>
                </div>

                {/* Fertility & Ovulation */}
                <div className="bg-white rounded-2xl border border-[#f0e8ee] p-4">
                  <h2 className="font-semibold text-[#3f2b4d] mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#b06a94]" />
                    Fertility & Ovulation
                  </h2>
                  <div className="divide-y divide-[#f0e8ee]">
                    <ToggleSwitch
                      enabled={settings.fertile_window}
                      onChange={() => handleSettingChange("fertile_window")}
                      label="Fertile window"
                      description="Notify when your fertile window is approaching"
                      loading={savingSetting === "fertile_window"}
                    />
                  </div>
                </div>

                {/* Daily Reminders */}
                <div className="bg-white rounded-2xl border border-[#f0e8ee] p-4">
                  <h2 className="font-semibold text-[#3f2b4d] mb-1 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#0369a1]" />
                    Daily Reminders
                  </h2>
                  <div className="divide-y divide-[#f0e8ee]">
                    <ToggleSwitch
                      enabled={settings.log_symptoms}
                      onChange={() => handleSettingChange("log_symptoms")}
                      label="Log symptoms"
                      description="Remind to log your daily symptoms"
                      loading={savingSetting === "log_symptoms"}
                    />
                    <ToggleSwitch
                      enabled={settings.drink_water}
                      onChange={() => handleSettingChange("drink_water")}
                      label="Drink water"
                      description="Stay hydrated with gentle reminders"
                      loading={savingSetting === "drink_water"}
                    />
                  </div>
                </div>

                {/* AI Insights */}
                <div className="bg-white rounded-2xl border border-[#f0e8ee] p-4">
                  <h2 className="font-semibold text-[#3f2b4d] mb-1 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#b06a94]" />
                    AI Insights
                  </h2>
                  <div className="divide-y divide-[#f0e8ee]">
                    <ToggleSwitch
                      enabled={settings.ai_patterns}
                      onChange={() => handleSettingChange("ai_patterns")}
                      label="Pattern detection"
                      description="Notify when a new pattern is detected in your cycle"
                      loading={savingSetting === "ai_patterns"}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Clear All Confirmation Modal */}
      <ClearAllModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        isClearing={clearingAll}
      />
    </div>
  )
}
