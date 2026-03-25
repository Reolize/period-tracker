"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Settings, 
  Edit2,
  X,
  Check,
  AlertTriangle,
  Save,
  ChevronRight,
  Database
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import AdminSidebar from "@/app/components/AdminSidebar"

// Types
interface SystemSetting {
  key: string
  value: string
  description: string | null
  updated_at: string
}

// Toast Notification Component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right ${
      type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
    }`}>
      {type === "success" ? <Check size={18} /> : <AlertTriangle size={18} />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  )
}

// Edit Modal Component
function EditSettingModal({
  setting,
  isOpen,
  onClose,
  onSave,
  isSaving
}: {
  setting: SystemSetting | null
  isOpen: boolean
  onClose: () => void
  onSave: (key: string, value: string, description: string | null) => void
  isSaving: boolean
}) {
  const [value, setValue] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (setting) {
      setValue(setting.value)
      setDescription(setting.description || "")
    }
  }, [setting])

  if (!isOpen || !setting) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800">Edit Setting</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Key</label>
            <input
              type="text"
              value={setting.key}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-slate-100 text-slate-500 font-mono text-sm border-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Value</label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-[#ff7eb6] focus:bg-white outline-none transition-all text-slate-800"
              placeholder="Enter value..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-[#ff7eb6] focus:bg-white outline-none transition-all text-slate-800 resize-none"
              placeholder="Enter description..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(setting.key, value, description || null)}
            disabled={isSaving || value === setting.value}
            className="flex-1 py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-[#ff7eb6] to-[#ff6b9d] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Skeleton Component
function SettingCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-full mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-6 bg-slate-200 rounded w-24" />
        <div className="h-8 bg-slate-200 rounded w-16" />
      </div>
    </div>
  )
}

// Main Page Component
export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const data = await apiFetch("/admin/settings")
        setSettings(data)
      } catch (err: any) {
        console.error("Failed to fetch settings:", err)
        
        // Check for 403 (not admin)
        if (err.message?.includes("403") || err.message?.includes("Admin access required")) {
          setToast({ message: "Access Denied: Admin privileges required", type: "error" })
          setTimeout(() => router.push("/dashboard"), 2000)
          return
        }
        
        setError(err.message || "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [router])

  // Handle edit
  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting)
    setIsModalOpen(true)
  }

  // Handle save
  const handleSave = async (key: string, value: string, description: string | null) => {
    try {
      setIsSaving(true)
      
      await apiFetch(`/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value, description })
      })

      // Update local state
      setSettings(prev => prev.map(s => 
        s.key === key 
          ? { ...s, value, description, updated_at: new Date().toISOString() }
          : s
      ))

      setToast({ message: "Setting updated successfully!", type: "success" })
      setIsModalOpen(false)
      setEditingSetting(null)
    } catch (err: any) {
      console.error("Failed to save setting:", err)
      setToast({ message: err.message || "Failed to save setting", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle close modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingSetting(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin/settings" className="hover:text-[#ff7eb6] transition-colors">
                Admin
              </Link>
              <ChevronRight size={14} />
              <span className="text-slate-700">System Configurations</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">System Configurations</h1>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <SettingCardSkeleton />
              <SettingCardSkeleton />
              <SettingCardSkeleton />
              <SettingCardSkeleton />
              <SettingCardSkeleton />
              <SettingCardSkeleton />
            </div>
          ) : error ? (
            // Error state
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
              <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Settings</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            // Settings grid
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:border-[#ff7eb6]/30 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                      {setting.key}
                    </code>
                    <button
                      onClick={() => handleEdit(setting)}
                      className="p-2 text-slate-400 hover:text-[#ff7eb6] hover:bg-[#fff0f6] rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Edit setting"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>

                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {setting.description || "No description provided"}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                      {setting.value}
                    </div>
                    <button
                      onClick={() => handleEdit(setting)}
                      className="text-sm font-medium text-[#ff7eb6] hover:text-[#e05896] transition-colors"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
                    Updated: {new Date(setting.updated_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && settings.length === 0 && (
            <div className="text-center py-16">
              <Database size={64} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No Settings Found</h3>
              <p className="text-slate-500">
                The system settings database is empty. Please initialize default settings on the backend.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <EditSettingModal
        setting={editingSetting}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
