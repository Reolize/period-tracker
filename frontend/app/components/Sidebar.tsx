"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, BookOpen, Settings, Droplet, Bell, ShieldCheck, X } from "lucide-react"

interface SidebarProps {
  onMobileClose?: () => void
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Insights", path: "/trends", icon: LineChart },
    { name: "Health Library", path: "/health-library", icon: BookOpen },
    { name: "Notifications", path: "/notifications", icon: Bell },
    { name: "Data Privacy", path: "/data-privacy", icon: ShieldCheck },
    { name: "Settings", path: "/account", icon: Settings },
  ]

  const handleLinkClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-[#f0e8ee] flex flex-col h-full shrink-0">
      {/* Logo Section with Mobile Close Button */}
      <div className="h-16 flex items-center px-6 border-b border-[#f0e8ee] justify-between">
        <div className="flex items-center gap-2 text-[#ff7eb6] font-bold text-xl tracking-tight">
          <Droplet fill="currentColor" size={24} />
          <span>Period Tracker</span>
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={onMobileClose}
          className="md:hidden p-2 rounded-lg hover:bg-[#faf6f8] text-[#7d6b86]"
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
                isActive
                  ? "bg-[#fff0f6] text-[#ff7eb6]"
                  : "text-[#7d6b86] hover:bg-[#faf6f8] hover:text-[#3f2b4d]"
              }`}
            >
              <Icon size={20} className={isActive ? "text-[#ff7eb6]" : "text-[#b06a94]"} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Section (e.g., App Version or small note) */}
      <div className="p-6 border-t border-[#f0e8ee] text-xs text-[#b06a94] text-center">
        Period Tracker v2.0
      </div>
    </aside>
  )
}