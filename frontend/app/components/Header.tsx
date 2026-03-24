"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Plus, User, LogOut, ChevronDown, Menu } from "lucide-react"
import { apiFetch } from "@/lib/api"

interface HeaderProps {
  onMenuClick?: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Fetch the logged-in user's email
    apiFetch("/users/me")
      .then(res => setUserEmail(res.email))
      .catch(err => console.error("Failed to load user email:", err))
  }, [])

  const handleLogout = async () => {
    // Clear token instead of old logout logic if it was using token
    localStorage.removeItem("token")
    router.push("/")
  }

  // Get current date formatted like "Monday, Mar 21"
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