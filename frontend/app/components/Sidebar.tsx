"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  LayoutDashboard, 
  LineChart, 
  BookOpen, 
  Settings, 
  Droplet, 
  Bell, 
  ShieldCheck, 
  X,
  BarChart3,
  Users,
  Home,
  LogOut,
  MessageCircle
} from "lucide-react"
import { apiFetch } from "@/lib/api"

interface SidebarProps {
  onMobileClose?: () => void
}

interface UserProfile {
  id: number
  email: string
  is_admin: boolean
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch user profile to check admin status
    apiFetch("/users/me")
      .then(res => setUser(res))
      .catch(err => console.error("Failed to load user:", err))
      .finally(() => setLoading(false))
  }, [])

  const isAdmin = user?.is_admin || false

  // Regular user navigation items
  const userNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Insights", path: "/trends", icon: LineChart },
    { name: "Community", path: "/community", icon: MessageCircle },
    { name: "Health Library", path: "/health-library", icon: BookOpen },
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "Data Privacy", path: "/data-privacy", icon: ShieldCheck },
    { name: "Settings", path: "/account", icon: Settings },
  ]

  // Admin navigation items
  const adminNavItems = [
    { name: "Overview", path: "/admin", icon: BarChart3 },
    { name: "System Settings", path: "/admin/settings", icon: Settings },
    { name: "User Management", path: "/admin/users", icon: Users },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <aside className={`w-64 flex flex-col h-full shrink-0 ${isAdmin ? 'bg-slate-900 text-white' : 'bg-white border-r border-[#f0e8ee]'}`}>
      {/* Logo Section with Mobile Close Button */}
      <div className={`h-16 flex items-center px-6 justify-between ${isAdmin ? 'border-b border-slate-800' : 'border-b border-[#f0e8ee]'}`}>
        <div className={`flex items-center gap-2 font-bold text-xl tracking-tight ${isAdmin ? 'text-white' : 'text-[#ff7eb6]'}`}>
          <Droplet fill="currentColor" size={24} />
          <span>{isAdmin ? 'Admin Panel' : 'Period Tracker'}</span>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onMobileClose}
          className={`md:hidden p-2 rounded-lg ${isAdmin ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-[#faf6f8] text-[#7d6b86]'}`}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.path !== "#" && (pathname === item.path || pathname.startsWith(`${item.path}/`))
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isAdmin
                  ? isActive
                    ? "bg-[#ff7eb6]/20 text-[#ff7eb6]"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : isActive
                    ? "bg-[#fff0f6] text-[#ff7eb6]"
                    : "text-[#7d6b86] hover:bg-[#faf6f8] hover:text-[#3f2b4d]"
              }`}
            >
              <Icon size={20} className={isActive ? (isAdmin ? "text-[#ff7eb6]" : "text-[#ff7eb6]") : (isAdmin ? "text-slate-400" : "text-[#b06a94]")} />
              {item.name}
            </Link>
          )
        })}

        {/* Show User Menu for Admin */}
        {isAdmin && (
          <>
            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider mt-6 ${isAdmin ? 'text-slate-500' : 'text-[#b06a94]'}`}>
              Navigation
            </div>
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
            >
              <LayoutDashboard size={20} />
              User Dashboard
            </Link>
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-medium"
            >
              <Home size={20} />
              Home Page
            </Link>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className={`p-4 border-t ${isAdmin ? 'border-slate-800' : 'border-[#f0e8ee]'}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
            isAdmin 
              ? 'text-slate-400 hover:text-red-400 hover:bg-slate-800' 
              : 'text-[#7d6b86] hover:text-red-600 hover:bg-red-50'
          }`}
        >
          <LogOut size={20} />
          Logout
        </button>
        
        {!isAdmin && (
          <div className="mt-4 text-xs text-[#b06a94] text-center">
            Period Tracker v2.0
          </div>
        )}
      </div>
    </aside>
  )
}