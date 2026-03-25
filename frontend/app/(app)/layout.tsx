"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Check if this is an admin route - admin pages have their own layout
  const isAdminRoute = pathname?.startsWith("/admin")

  // For admin routes, render children directly without the default sidebar/header
  if (isAdminRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#fff7fb] overflow-hidden">
      {/* Sidebar - Hidden on mobile by default */}
      <div className={`${mobileMenuOpen ? 'fixed inset-0 z-50 flex' : 'hidden md:flex md:h-screen'}`}>
        {/* Backdrop for mobile */}
        {mobileMenuOpen && (
          <div 
            className="absolute inset-0 bg-black/50 md:hidden" 
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className={`${mobileMenuOpen ? 'relative animate-in slide-in-from-left duration-200 h-full' : 'h-full'}`}>
          <Sidebar onMobileClose={() => setMobileMenuOpen(false)} />
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}