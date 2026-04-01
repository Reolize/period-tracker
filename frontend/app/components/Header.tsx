"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Plus, User, LogOut, ChevronDown, Menu, Bell } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { NotificationResponse } from "@/app/types/tracking"

interface HeaderProps {
  onMenuClick?: () => void
}

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  reaction: { icon: "🫂", color: "text-pink-600", bg: "bg-pink-100" },
  comment: { icon: "💬", color: "text-purple-600", bg: "bg-purple-100" },
  cycle_prediction: { icon: "📅", color: "text-red-600", bg: "bg-red-100" },
  symptom_alert: { icon: "🩸", color: "text-orange-600", bg: "bg-orange-100" },
  system: { icon: "⚙️", color: "text-blue-600", bg: "bg-blue-100" },
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Notification states
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const notifDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch the logged-in user's email
    apiFetch("/users/me")
      .then(res => setUserEmail(res.email))
      .catch(err => console.error("Failed to load user email:", err))

    // Fetch notifications
    fetchNotifications()

    // Set up interval to refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch("/community/notifications?limit=5")
      if (data && data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unread_count || 0)
      }
    } catch (err) {
      console.error("Failed to load notifications:", err)
    }
  }

  const markAsRead = async (notifId: number, link?: string | null) => {
    try {
      await apiFetch(`/community/notifications/${notifId}/read`, {
        method: "PUT"
      })

      // Update local state
      setNotifications(prev => prev.map(n =>
        n.id === notifId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))

      // Navigate if link provided
      if (link) {
        setNotifDropdownOpen(false)
        router.push(link)
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const handleLogout = async () => {
    localStorage.removeItem("token")
    router.push("/")
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#f0e8ee] sticky top-0 z-30 flex items-center justify-between px-6 lg:px-8">
      
      {/* Left side: Hamburger Menu (mobile) + Greeting / Date */}
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[#faf6f8] text-[#7d6b86] transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#b06a94] uppercase tracking-wider">Today</span>
          <span className="text-[15px] font-bold text-[#3f2b4d]">{todayStr}</span>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4">
        
        {/* Quick Action Button */}
        <button 
          onClick={() => router.push("/dashboard")} // Or open modal directly if context allows
          className="hidden sm:flex items-center gap-1.5 bg-[#ff7eb6] hover:bg-[#e05896] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm shadow-[#ff7eb6]/30"
        >
          <Plus size={16} strokeWidth={3} />
          Log Symptoms
        </button>

        <button 
          onClick={() => router.push("/dashboard")}
          className="sm:hidden flex items-center justify-center bg-[#ff7eb6] text-white w-9 h-9 rounded-full shadow-sm shadow-[#ff7eb6]/30"
        >
          <Plus size={18} strokeWidth={3} />
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-[#f0e8ee] hidden sm:block"></div>

        {/* Notification Bell */}
        <div className="relative" ref={notifDropdownRef}>
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-full hover:bg-[#faf6f8] text-[#7d6b86] transition-colors"
            aria-label="Notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#f0e8ee] py-2 overflow-hidden animate-fadeSlideIn z-50">
              <div className="px-4 py-2 border-b border-[#f0e8ee] flex items-center justify-between">
                <p className="text-sm font-semibold text-[#3f2b4d]">Notifications</p>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[#7d6b86]">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const style = NOTIFICATION_ICONS[notif.type] || NOTIFICATION_ICONS.system
                    return (
                      <button
                        key={notif.id}
                        onClick={() => markAsRead(notif.id, notif.link)}
                        className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#faf6f8] transition-colors text-left ${
                          !notif.is_read ? "bg-[#fff5f8]" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-lg">{style.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#3f2b4d] truncate">{notif.title}</p>
                          <p className="text-xs text-[#7d6b86] line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-[#b06a94] mt-1">{formatTimeAgo(notif.created_at)}</p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-[#ff7eb6] rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
              
              <div className="px-4 py-2 border-t border-[#f0e8ee]">
                <button
                  onClick={() => {
                    setNotifDropdownOpen(false)
                    router.push("/notifications")
                  }}
                  className="w-full text-center text-sm text-[#ff7eb6] hover:text-[#e05896] font-medium py-2 transition-colors"
                >
                  View all notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-[#f0e8ee] hidden sm:block"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-[#faf6f8] border border-transparent hover:border-[#f0e8ee] transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-[#f7f1ff] text-[#b06a94] flex items-center justify-center border border-[#e0d4f0]">
              <User size={16} />
            </div>
            <ChevronDown size={14} className="text-[#7d6b86]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#f0e8ee] py-2 overflow-hidden animate-fadeSlideIn">
              <div className="px-4 py-2 border-b border-[#f0e8ee] mb-1">
                <p className="text-sm font-semibold text-[#3f2b4d]">My Account</p>
                <p className="text-xs text-[#7d6b86] truncate">
                  {userEmail || "Loading..."}
                </p>
              </div>
              
              <button 
                onClick={() => {
                  router.push("/account")
                  setUserMenuOpen(false)
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#3f2b4d] hover:bg-[#faf6f8] transition-colors text-left"
              >
                <User size={16} className="text-[#b06a94]" />
                Profile Settings
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}