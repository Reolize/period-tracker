"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  BarChart3,
  Users,
  Settings,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Brain
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import AdminSidebar from "@/app/components/AdminSidebar"

// Types
interface UserProfile {
  id: number
  email: string
  is_admin: boolean
}

interface AdminStats {
  total_users: number
  total_admins: number
  total_settings: number
  recent_activities: {
    type: string
    message: string
    timestamp: string
  }[]
}

// Toast Component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <span className="text-lg">&times;</span>
      </button>
    </div>
  )
}

// Stat Card Skeleton
function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
          <div className="h-8 bg-slate-200 rounded w-16" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-slate-200" />
      </div>
    </div>
  )
}

// Activity Skeleton
function ActivitySkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-slate-200" />
        <div>
          <div className="h-4 bg-slate-200 rounded w-48 mb-1" />
          <div className="h-3 bg-slate-200 rounded w-32" />
        </div>
      </div>
      <div className="h-3 bg-slate-200 rounded w-20" />
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = "blue"
}: { 
  title: string
  value: string | number
  icon: any
  trend?: string
  color?: "blue" | "green" | "pink" | "purple"
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    pink: "from-[#ff7eb6] to-[#ff6b9d]",
    purple: "from-purple-500 to-purple-600"
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp size={14} />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  )
}

// Quick Action Card
function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  href,
  color = "pink"
}: { 
  title: string
  description: string
  icon: any
  href: string
  color?: "pink" | "blue" | "purple"
}) {
  const colorClasses = {
    pink: "from-[#ff7eb6]/10 to-[#ff6b9d]/10 border-[#ff7eb6]/20 hover:border-[#ff7eb6]/40",
    blue: "from-blue-50 to-blue-100/50 border-blue-200 hover:border-blue-300",
    purple: "from-purple-50 to-purple-100/50 border-purple-200 hover:border-purple-300"
  }

  const iconColors = {
    pink: "text-[#ff7eb6]",
    blue: "text-blue-500",
    purple: "text-purple-500"
  }

  return (
    <Link
      href={href}
      className={`block p-6 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border transition-all hover:shadow-lg group`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white shadow-sm ${iconColors[color]}`}>
          <Icon size={24} />
        </div>
        <ArrowRight size={20} className={`${iconColors[color]} opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1`} />
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </Link>
  )
}

// Main Page Component
export default function AdminOverviewPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  
  // ML Data Export states
  const [mlExportOpen, setMlExportOpen] = useState(false)
  const [minCycles, setMinCycles] = useState(6)
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userData = await apiFetch("/users/me")
        setUser(userData)
        
        if (!userData.is_admin) {
          setToast({ message: "Access Denied: Admin privileges required", type: "error" })
          setTimeout(() => router.push("/dashboard"), 2000)
        }
      } catch (err: any) {
        console.error("Failed to load user:", err)
        if (err.message?.includes("403") || err.message?.includes("Admin access required")) {
          setToast({ message: "Access Denied: Admin privileges required", type: "error" })
          setTimeout(() => router.push("/dashboard"), 2000)
        } else {
          setToast({ message: "Failed to authenticate", type: "error" })
        }
      } finally {
        setLoading(false)
      }
    }

    checkAdmin()
  }, [router])

  // Fetch admin stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.is_admin) return
      
      try {
        setStatsLoading(true)
        const data = await apiFetch("/admin/stats")
        setStats(data)
      } catch (err: any) {
        console.error("Failed to fetch stats:", err)
        setToast({ message: err.message || "Failed to load statistics", type: "error" })
      } finally {
        setStatsLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ff7eb6] rounded-lg"></div>
          <div className="text-lg font-medium text-slate-600">Loading Admin Dashboard...</div>
        </div>
      </div>
    )
  }

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " minutes ago"
    
    return "Just now"
  }

  // Get activity color based on type
  const getActivityColor = (type: string) => {
    switch (type) {
      case "user_registered": return "bg-blue-500"
      case "setting_updated": return "bg-[#ff7eb6]"
      default: return "bg-slate-400"
    }
  }

  // Handle ML Data Export
  const handleMlExport = async () => {
    setExportLoading(true)
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      // Fetch the CSV data from the backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/admin/export-ml-data?min_cycles=${minCycles}`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No users found with at least ${minCycles} completed cycles`)
        }
        throw new Error("Failed to export data")
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition")
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      link.download = filenameMatch?.[1] || `ml_training_data_${new Date().getFullYear()}.csv`
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setToast({ message: "ML training data exported successfully!", type: "success" })
      setMlExportOpen(false)
    } catch (err: any) {
      console.error("Export failed:", err)
      setToast({ message: err.message || "Failed to export data", type: "error" })
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-700">Overview</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Command Center</h1>
                <p className="text-slate-500">Manage application settings and monitor system health.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 bg-green-100 text-green-700">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  System Online
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Users"
                  value={stats?.total_users || 0}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Total Admins"
                  value={stats?.total_admins || 0}
                  icon={Shield}
                  color="purple"
                />
                <StatCard
                  title="System Configs"
                  value={stats?.total_settings || 0}
                  icon={Settings}
                  color="pink"
                />
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickActionCard
                title="Configure System Settings"
                description="Manage application configuration, session timeouts, and default values."
                icon={Settings}
                href="/admin/settings"
                color="pink"
              />
              <QuickActionCard
                title="User Management"
                description="View and manage user accounts, permissions, and activity."
                icon={Users}
                href="/admin/users"
                color="blue"
              />
              <button
                onClick={() => setMlExportOpen(true)}
                className="block p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 hover:border-indigo-300 transition-all hover:shadow-lg group text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white shadow-sm text-indigo-500">
                    <Brain size={24} />
                  </div>
                  <ArrowRight size={20} className="text-indigo-500 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">Export ML Training Data</h3>
                <p className="text-sm text-slate-500">Download anonymized cycle data for ML model training.</p>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <div className="p-6">
              {statsLoading ? (
                <div className="space-y-4">
                  <ActivitySkeleton />
                  <ActivitySkeleton />
                  <ActivitySkeleton />
                </div>
              ) : stats?.recent_activities && stats.recent_activities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_activities.map((activity, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.type)}`} />
                        <div>
                          <p className="font-medium text-slate-800">{activity.message}</p>
                        </div>
                      </div>
                      <span className="text-sm text-slate-400">{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* ML Data Export Dialog */}
      {mlExportOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <Brain size={20} />
                </div>
                <h3 className="font-semibold text-slate-800">Export ML Training Data</h3>
              </div>
              <button
                onClick={() => setMlExportOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="text-xl">&times;</span>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Download anonymized cycle data for training the Global ML model. 
                Only users with sufficient historical data will be included.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Minimum Cycles Required
                </label>
                <select
                  value={minCycles}
                  onChange={(e) => setMinCycles(Number(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                >
                  <option value={3}>3 cycles (more data, lower quality)</option>
                  <option value={6}>6 cycles (balanced)</option>
                  <option value={12}>12 cycles (high quality)</option>
                </select>
              </div>
              
              <div className="bg-indigo-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-indigo-800 mb-1">Data Privacy</p>
                <p className="text-indigo-600">
                  All PII is automatically stripped. User IDs are replaced with anonymous 
                  identifiers. Only numerical cycle features are exported.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setMlExportOpen(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleMlExport}
                disabled={exportLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Exporting...
                  </>
                ) : (
                  "Export CSV"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
