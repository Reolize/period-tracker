"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { 
  BarChart3,
  Users,
  Settings,
  LogOut
} from "lucide-react"
import { apiFetch } from "@/lib/api"

interface UserProfile {
  id: number
  email: string
  is_admin: boolean
}

interface AdminSidebarProps {
  onMobileClose?: () => void
}

export default function AdminSidebar({ onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    apiFetch("/users/me")
      .then(res => setUser(res))
      .catch(err => console.error("Failed to load user:", err))
  }, [])

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff7eb6] to-[#ff6b9d] flex items-center justify-center">
            <Settings size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg">Admin Panel</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <Link
          href="/admin"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive("/admin") && pathname === "/admin"
              ? "bg-[#ff7eb6]/20 text-[#ff7eb6]"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <BarChart3 size={20} />
          Overview
        </Link>

        <Link
          href="/admin/settings"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive("/admin/settings")
              ? "bg-[#ff7eb6]/20 text-[#ff7eb6]"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Settings size={20} />
          System Settings
        </Link>

        <Link
          href="/admin/users"
          onClick={handleLinkClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
            isActive("/admin/users")
              ? "bg-[#ff7eb6]/20 text-[#ff7eb6]"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Users size={20} />
          User Management
        </Link>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
