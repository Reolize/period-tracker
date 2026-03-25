"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users,
  Settings,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Loader2
} from "lucide-react"
import { apiFetch } from "@/lib/api"
import AdminSidebar from "@/app/components/AdminSidebar"

interface UserProfile {
  id: number
  email: string
  is_admin: boolean
}

interface User {
  id: number
  email: string
  is_admin: boolean
  created_at: string
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

// Table Skeleton Component
function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="h-6 bg-slate-200 rounded w-32" />
      </div>
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-200" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-48" />
                <div className="h-3 bg-slate-200 rounded w-24" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 bg-slate-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Page Component
export default function UserManagementPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterAdmin, setFilterAdmin] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userData = await apiFetch("/users/me")
        setCurrentUser(userData)
        
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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser?.is_admin) return
      
      try {
        setUsersLoading(true)
        const data = await apiFetch("/admin/users")
        setUsers(data)
        setFilteredUsers(data)
      } catch (err: any) {
        console.error("Failed to fetch users:", err)
        setToast({ message: err.message || "Failed to load users", type: "error" })
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [currentUser])

  // Filter users based on search query and admin filter
  useEffect(() => {
    let filtered = users

    // Search by email
    if (searchQuery.trim()) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by admin status
    if (filterAdmin) {
      filtered = filtered.filter(user => user.is_admin)
    }

    setFilteredUsers(filtered)
  }, [searchQuery, filterAdmin, users])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ff7eb6] rounded-lg"></div>
          <div className="text-lg font-medium text-slate-600">Loading User Management...</div>
        </div>
      </div>
    )
  }

  if (!currentUser?.is_admin) {
    return null
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
              <Link href="/admin" className="hover:text-[#ff7eb6] transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-slate-700">User Management</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
            <p className="text-slate-500">Manage user accounts and permissions.</p>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search users by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-[#ff7eb6] focus:bg-white outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setFilterAdmin(!filterAdmin)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                filterAdmin 
                  ? "bg-[#fff0f6] border-[#ff7eb6] text-[#ff7eb6]" 
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Filter size={18} />
              <span className="font-medium">{filterAdmin ? "Admins Only" : "All Users"}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-slate-800">{users.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Admins</p>
              <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.is_admin).length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <p className="text-sm text-slate-500 mb-1">Filtered Results</p>
              <p className="text-2xl font-bold text-slate-800">{filteredUsers.length}</p>
            </div>
          </div>

          {/* Users Table */}
          {usersLoading ? (
            <TableSkeleton />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Users</h3>
              </div>
              
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={48} className="text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Users Found</h3>
                  <p className="text-slate-500">
                    {searchQuery || filterAdmin 
                      ? "No users match your search criteria." 
                      : "No users in the database yet."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* Table Header */}
                  <div className="px-6 py-3 bg-slate-50 grid grid-cols-12 gap-4 text-sm font-semibold text-slate-600">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-5">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-3">Joined Date</div>
                    <div className="col-span-1">Status</div>
                  </div>
                  
                  {/* Table Rows */}
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50 transition-colors">
                      <div className="col-span-1 text-slate-500 font-mono text-sm">
                        #{user.id}
                      </div>
                      <div className="col-span-5">
                        <p className="font-medium text-slate-800">{user.email}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_admin 
                            ? "bg-[#fff0f6] text-[#ff7eb6]" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {user.is_admin ? "Admin" : "User"}
                        </span>
                      </div>
                      <div className="col-span-3 text-slate-500 text-sm">
                        {formatDate(user.created_at)}
                      </div>
                      <div className="col-span-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" title="Active" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
    </div>
  )
}
