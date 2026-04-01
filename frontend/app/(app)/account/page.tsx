"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { 
  Mail, ShieldAlert, Edit2, Save, Info, X, Camera, AtSign, AlertCircle, Upload,
  Download, Trash2, RotateCcw, Heart, Settings, Bell, Activity, Scale, Ruler,
  Sparkles, Calendar, ShieldCheck
} from "lucide-react"

// Predefined cute avatars from Dicebear
const PREDEFINED_AVATARS = [
  { id: 0, url: "https://api.dicebear.com/7.x/notionists/svg?seed=1&backgroundColor=ffdfbf", name: "Sunny" },
  { id: 1, url: "https://api.dicebear.com/7.x/notionists/svg?seed=2&backgroundColor=c0aede", name: "Lavender" },
  { id: 2, url: "https://api.dicebear.com/7.x/notionists/svg?seed=3&backgroundColor=b6e3f4", name: "Sky" },
  { id: 3, url: "https://api.dicebear.com/7.x/notionists/svg?seed=4&backgroundColor=ffd5dc", name: "Rose" },
  { id: 4, url: "https://api.dicebear.com/7.x/notionists/svg?seed=5&backgroundColor=d1d4f9", name: "Periwinkle" },
  { id: 5, url: "https://api.dicebear.com/7.x/notionists/svg?seed=6&backgroundColor=ffdfbf", name: "Peach" },
]

export default function AccountPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Loading & Error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "health" | "settings">("profile")
  
  // User profile data
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [badges, setBadges] = useState<string[]>([])
  const [joinedAt, setJoinedAt] = useState("")
  const [lastUsernameChange, setLastUsernameChange] = useState<string | null>(null)
  
  // Avatar modal states
  const [isEditingAvatar, setIsEditingAvatar] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null)
  
  // Username validation
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [cooldownDays, setCooldownDays] = useState<number>(0)
  
  // Health data states
  const [weightKg, setWeightKg] = useState<number | "">("")
  const [heightCm, setHeightCm] = useState<number | "">("")
  const [hasPcosOrIrregular, setHasPcosOrIrregular] = useState<boolean>(false)
  const [predictionMode, setPredictionMode] = useState<"smart" | "strict" | "fixed">("smart")
  
  // Manual cycle length for Fixed Number mode
  const [manualCycleLength, setManualCycleLength] = useState<number>(28)
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true)
  const [reminderDays, setReminderDays] = useState<number>(3)
  
  // Privacy settings
  const [shareAnonymousData, setShareAnonymousData] = useState<boolean>(true)
  const [anonymousMode, setAnonymousMode] = useState<boolean>(false)
  
  // Prediction data from backend
  const [predictionData, setPredictionData] = useState<any>(null)
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false)

  // Fetch prediction data when mode, PCOS setting, or manual cycle length changes
  useEffect(() => {
    fetchPrediction()
  }, [predictionMode, hasPcosOrIrregular, manualCycleLength])

  async function fetchPrediction() {
    setPredictionLoading(true)
    try {
      const res = await apiFetch(`/users/me/next-period-prediction?prediction_mode=${predictionMode}`)
      setPredictionData(res)
    } catch (e) {
      console.log("Failed to fetch prediction", e)
    } finally {
      setPredictionLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // Load user profile data
      const userRes = await apiFetch("/users/me")
      setEmail(userRes.email)
      setUsername(userRes.username || "")
      setAvatarUrl(userRes.avatar_url || "")
      setBadges(userRes.badges || [])
      setJoinedAt(userRes.joined_at || "")
      setLastUsernameChange(userRes.last_username_change || null)
      
      if (userRes.last_username_change) {
        const lastChange = new Date(userRes.last_username_change)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24))
        setCooldownDays(Math.max(0, 90 - daysDiff))
      }
      
      // Load health/setup data
      try {
        const setupRes = await apiFetch("/user-setup/")
        if (setupRes) {
          setWeightKg(setupRes.weight_kg || "")
          setHeightCm(setupRes.height_cm || "")
          setHasPcosOrIrregular(setupRes.has_pcos_or_irregular || false)
          setPredictionMode(setupRes.prediction_mode || "smart")
          setManualCycleLength(setupRes.manual_cycle_length || 28)
          setNotificationsEnabled(setupRes.notifications_enabled !== false)
          setReminderDays(setupRes.reminder_days || 3)
        }
      } catch (e) {
        console.log("No setup data found")
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate BMI
  const calculateBMI = (): number | null => {
    if (weightKg && heightCm && weightKg > 0 && heightCm > 0) {
      const heightM = Number(heightCm) / 100
      return Number((Number(weightKg) / (heightM * heightM)).toFixed(1))
    }
    return null
  }

  const getBMICategory = (bmi: number): { label: string; color: string } => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" }
    if (bmi < 25) return { label: "Healthy", color: "text-green-500" }
    if (bmi < 30) return { label: "Overweight", color: "text-amber-500" }
    return { label: "Obese", color: "text-red-500" }
  }

  function validateUsername(value: string): boolean {
    if (!value) return true
    if (value.length < 3 || value.length > 20) {
      setUsernameError("Username must be 3-20 characters")
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameError("Only letters, numbers, and underscores allowed")
      return false
    }
    setUsernameError(null)
    return true
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.toLowerCase()
    setUsername(value)
    validateUsername(value)
  }

  async function handleSaveAll() {
    if (cooldownDays > 0) {
      const userRes = await apiFetch("/users/me")
      if (username !== userRes.username) {
        setUsernameError(`Username can only be changed once every 3 months. ${cooldownDays} days remaining.`)
        return
      }
    }
    
    if (!validateUsername(username)) return
    
    setSaving(true)
    try {
      // Save profile data
      const profilePayload: any = {}
      if (username) profilePayload.username = username
      if (avatarUrl) profilePayload.avatar_url = avatarUrl
      
      await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify(profilePayload)
      })
      
      // Save health/setup data
      const setupPayload = {
        weight_kg: weightKg ? Number(weightKg) : null,
        height_cm: heightCm ? Number(heightCm) : null,
        has_pcos_or_irregular: hasPcosOrIrregular,
        prediction_mode: predictionMode,
        manual_cycle_length: manualCycleLength,
        notifications_enabled: notificationsEnabled,
        reminder_days: reminderDays
      }
      
      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify(setupPayload)
      })
      
      await loadData()
    } catch (err: any) {
      setUsernameError(err.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await apiFetch("/users/me/avatar", {
        method: "POST",
        body: formData,
        headers: {}
      })
      
      setAvatarUrl(res.avatar_url)
      setIsEditingAvatar(false)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to upload avatar")
    } finally {
      setUploading(false)
    }
  }

  async function handleSelectPredefined(avatarId: number) {
    setSelectedAvatarId(avatarId)
    setUploading(true)
    
    try {
      const res = await apiFetch(`/users/me/avatar/predefined?avatar_index=${avatarId}`, {
        method: "POST",
      })
      
      setAvatarUrl(res.avatar_url)
      setIsEditingAvatar(false)
      setSelectedAvatarId(null)
      await loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || "Failed to set avatar")
    } finally {
      setUploading(false)
    }
  }

  const displayName = username || email.split('@')[0]
  const isCooldownActive = cooldownDays > 0
  const bmi = calculateBMI()
  const bmiCategory = bmi ? getBMICategory(bmi) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-300 to-violet-300 animate-pulse" />
          <p className="text-gray-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-violet-50 p-4">
        <div className="max-w-md mx-auto mt-20">
          <div className="bg-white border border-red-100 rounded-3xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
              <ShieldAlert className="text-red-400" size={32} />
            </div>
            <h3 className="text-red-800 font-bold text-lg mb-2">Connection Error</h3>
            <p className="text-red-600 text-sm mb-6">{error}</p>
            <button 
              onClick={() => {
                setError(null)
                loadData()
              }}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-white to-violet-50/30 pb-12">
      {/* Avatar Modal */}
      {isEditingAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Choose Your Avatar</h3>
                <button 
                  onClick={() => {
                    setIsEditingAvatar(false)
                    setSelectedAvatarId(null)
                  }}
                  className="p-2 hover:bg-pink-50 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full py-4 border-2 border-dashed border-pink-300 rounded-2xl flex items-center justify-center gap-2 text-pink-600 font-medium hover:bg-pink-50 transition-colors"
                >
                  <Upload size={20} />
                  {uploading ? "Uploading..." : "Upload Custom Photo"}
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400 font-medium">or choose predefined</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {PREDEFINED_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectPredefined(avatar.id)}
                    disabled={uploading}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      selectedAvatarId === avatar.id 
                        ? 'border-pink-500 bg-pink-50' 
                        : 'border-gray-100 hover:border-pink-300 hover:bg-pink-50/50'
                    } disabled:opacity-50`}
                  >
                    <img 
                      src={avatar.url} 
                      alt={avatar.name}
                      className="w-16 h-16 mx-auto rounded-full"
                    />
                    <p className="mt-2 text-xs text-gray-600 font-medium text-center">{avatar.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6 pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Your Profile</h1>
          <p className="text-gray-500 mt-2">Manage your account and health settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-pink-100">
          {[
            { id: "profile", label: "Profile", icon: AtSign },
            { id: "health", label: "Health", icon: Heart },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-pink-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl p-8 shadow-lg shadow-pink-100/50 border border-pink-100">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 to-violet-400 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden ring-4 ring-white">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => setIsEditingAvatar(true)}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-pink-500 hover:bg-pink-50 hover:scale-110 transition-all border-2 border-pink-100"
                >
                  <Camera size={18} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mt-4">{displayName}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                <Mail size={14} />
                {email}
              </p>
              {joinedAt && (
                <p className="text-xs text-pink-400 mt-2">
                  Member since {new Date(joinedAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Username Field */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AtSign size={16} className="text-pink-500" />
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Choose your unique username"
                    disabled={isCooldownActive}
                    className={`w-full border border-pink-100 p-4 pl-12 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent transition-all text-gray-800 bg-white ${
                      isCooldownActive ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
                    }`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                </div>
                
                {usernameError && (
                  <p className="mt-2 text-sm text-red-500 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    {usernameError}
                  </p>
                )}
                
                {isCooldownActive && (
                  <p className="mt-2 text-sm text-amber-600 flex items-center gap-1.5 bg-amber-50 p-3 rounded-xl">
                    <Info size={14} />
                    Username can be changed again in <strong>{cooldownDays} days</strong>
                  </p>
                )}
                
                {!isCooldownActive && !usernameError && (
                  <p className="mt-2 text-xs text-gray-400">
                    Username can only be changed once every 3 months. Use 3-20 characters (letters, numbers, underscores).
                  </p>
                )}
              </div>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="pt-4 border-t border-pink-50">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Badges</label>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <span 
                        key={badge}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-50 to-violet-50 rounded-full text-sm font-medium border border-pink-100"
                      >
                        {badge === "verified_doctor" && <span className="text-blue-500">🩺</span>}
                        {badge === "admin" && <span className="text-amber-500">👑</span>}
                        {badge === "1_year_veteran" && <span className="text-purple-500">🌟</span>}
                        <span className="text-gray-700">
                          {badge === "verified_doctor" && "Verified Doctor"}
                          {badge === "admin" && "Admin"}
                          {badge === "1_year_veteran" && "1 Year Veteran"}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Tab */}
        {activeTab === "health" && (
          <div className="space-y-4">
            {/* Health Data Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Heart size={20} className="text-pink-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Health Data</h3>
                  <p className="text-sm text-gray-500">Track your body metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Weight */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Scale size={14} className="text-gray-400" />
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : "")}
                    placeholder="70"
                    min="1"
                    max="300"
                    className="w-full border border-pink-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                    <Ruler size={14} className="text-gray-400" />
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : "")}
                    placeholder="165"
                    min="50"
                    max="250"
                    className="w-full border border-pink-100 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-800"
                  />
                </div>
              </div>

              {/* BMI Display */}
              {bmi && bmiCategory && (
                <div className="bg-gradient-to-r from-pink-50 to-violet-50 rounded-2xl p-4 border border-pink-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Your BMI</p>
                      <p className="text-3xl font-bold text-gray-800">{bmi}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-white shadow-sm ${bmiCategory.color}`}>
                        {bmiCategory.label}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                <div className="flex items-center gap-2 text-pink-500 mb-2">
                  <Scale size={18} />
                  <span className="text-sm font-medium">Weight</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {weightKg ? `${weightKg} kg` : "Not set"}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm">
                <div className="flex items-center gap-2 text-violet-500 mb-2">
                  <Ruler size={18} />
                  <span className="text-sm font-medium">Height</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {heightCm ? `${heightCm} cm` : "Not set"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* Cycle Settings Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                  <Activity size={20} className="text-violet-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Cycle Settings</h3>
                  <p className="text-sm text-gray-500">Customize your tracking experience</p>
                </div>
              </div>

              {/* Irregular Mode Toggle */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">Irregular Cycle Mode</p>
                  <p className="text-sm text-gray-500">Enable if you have PCOS or irregular periods</p>
                </div>
                <button
                  onClick={() => setHasPcosOrIrregular(!hasPcosOrIrregular)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    hasPcosOrIrregular ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      hasPcosOrIrregular ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Prediction Mode */}
              <div className="py-4 border-b border-gray-100">
                <label className="block font-medium text-gray-800 mb-4">Prediction Mode</label>
                <div className="flex flex-col gap-4">
                  {/* Smart Prediction Card */}
                  <button
                    onClick={() => setPredictionMode('smart')}
                    className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col gap-2 hover:shadow-lg text-left ${
                      predictionMode === 'smart'
                        ? 'border-pink-500 bg-pink-50/50 shadow-md'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">Smart AI Hybrid</h4>
                        <p className="text-sm text-gray-500 mt-1">Global baseline + weighted personal history. Adapts to your body.</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                        <Sparkles size={20} className="text-violet-500" />
                      </div>
                    </div>
                  </button>

                  {/* Regular Calendar Card */}
                  <button
                    onClick={() => setPredictionMode('strict')}
                    className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col gap-2 hover:shadow-lg text-left ${
                      predictionMode === 'strict'
                        ? 'border-pink-500 bg-pink-50/50 shadow-md'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">Regular Calendar</h4>
                        <p className="text-sm text-gray-500 mt-1">Pure personal history. Simple average of your last cycles.</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar size={20} className="text-blue-500" />
                      </div>
                    </div>
                  </button>

                  {/* Fixed Number Card */}
                  <button
                    onClick={() => setPredictionMode('fixed')}
                    className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col gap-2 hover:shadow-lg text-left ${
                      predictionMode === 'fixed'
                        ? 'border-pink-500 bg-pink-50/50 shadow-md'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">Fixed Number</h4>
                        <p className="text-sm text-gray-500 mt-1">User-defined cycle length. You control the prediction.</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Activity size={20} className="text-emerald-500" />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Fixed Number Input */}
                {predictionMode === 'fixed' && (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <label className="block font-medium text-gray-800 mb-2">
                      Your Cycle Length (days)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="21"
                        max="45"
                        value={manualCycleLength}
                        onChange={(e) => setManualCycleLength(Number(e.target.value))}
                        className="w-24 px-4 py-2 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 bg-white"
                      />
                      <span className="text-gray-500">days</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2">
                      Standard range: 21-45 days. Default is 28 days.
                    </p>
                  </div>
                )}

                {/* Live Preview */}
                <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-violet-50 rounded-xl border border-pink-200">
                  <p className="text-sm font-medium text-gray-800">
                    Current Mode: <span className="text-pink-600">{predictionMode === 'smart' ? 'Smart AI Hybrid' : predictionMode === 'strict' ? 'Regular Calendar' : 'Fixed Number'}</span>
                  </p>
                  {predictionData ? (
                    predictionData.has_enough_data ? (
                      <div className="text-xs text-gray-500 mt-2 space-y-1">
                        <p>
                          Estimated Next Period: <strong className="text-pink-600">{predictionData.predicted_days_remaining} days</strong>
                          {predictionData.accuracy_buffer && <span> (±{predictionData.accuracy_buffer} days)</span>}
                        </p>
                        {predictionData.mode_label && (
                          <p className="text-gray-400">Method: {predictionData.mode_label}</p>
                        )}
                        {predictionData.warning_message && (
                          <p className="text-amber-600">{predictionData.warning_message}</p>
                        )}
                        {predictionData.is_irregular_adjusted && (
                          <p className="text-pink-600">Adjusted for irregular cycles</p>
                        )}
                        {predictionData.manual_cycle_length && (
                          <p className="text-emerald-600">Using your custom: {predictionData.manual_cycle_length} days</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 mt-2">
                        {predictionData.message} — Log more periods for accurate predictions
                      </p>
                    )
                  ) : predictionLoading ? (
                    <p className="text-xs text-gray-400 mt-2">Calculating...</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Estimated Next Period: {predictionMode === 'smart' ? '12 days (Hybrid AI)' : predictionMode === 'strict' ? '14 days (From history)' : `${manualCycleLength} days (Fixed)`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Bell size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                  <p className="text-sm text-gray-500">Manage your reminders</p>
                </div>
              </div>

              {/* Enable Notifications Toggle */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">Enable Notifications</p>
                  <p className="text-sm text-gray-500">Get reminders before your period</p>
                </div>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    notificationsEnabled ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      notificationsEnabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Reminder Days */}
              {notificationsEnabled && (
                <div className="py-4">
                  <label className="block font-medium text-gray-800 mb-2">
                    Remind me {reminderDays} days before
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(Number(e.target.value))}
                    className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1 day</span>
                    <span>7 days</span>
                  </div>
                </div>
              )}
            </div>

            {/* Privacy & Security Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-pink-100">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-purple-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Privacy & Security</h3>
                  <p className="text-sm text-gray-500">Manage how your data is handled</p>
                </div>
              </div>

              {/* Share Anonymous Data Toggle */}
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-4">
                <div>
                  <p className="font-medium text-gray-800 flex items-center gap-2">
                    Share anonymous data for AI
                    <Sparkles size={16} className="text-pink-500" />
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Allow our machine learning models to learn from your cycle lengths to improve predictions for everyone. Your data is stripped of all personal identifiers.
                  </p>
                </div>
                <button
                  onClick={() => setShareAnonymousData(!shareAnonymousData)}
                  className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
                    shareAnonymousData ? 'bg-pink-500' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      shareAnonymousData ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Anonymous Mode Toggle */}
              <div className="flex items-start justify-between py-4 gap-4">
                <div>
                  <p className="font-medium text-gray-800">Enable Anonymous Mode</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Disconnect your email and identity from your health logs. Note: You won't be able to recover your data if you lose your device.
                  </p>
                </div>
                <button
                  onClick={() => setAnonymousMode(!anonymousMode)}
                  className={`relative w-14 h-8 shrink-0 rounded-full transition-colors ${
                    anonymousMode ? 'bg-gray-800' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      anonymousMode ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => {
              setUsername('')
              setAvatarUrl('')
              setWeightKg('')
              setHeightCm('')
              setHasPcosOrIrregular(false)
              setPredictionMode('smart')
              setManualCycleLength(28)
              setNotificationsEnabled(true)
              setReminderDays(3)
              setShareAnonymousData(true)
              setAnonymousMode(false)
              setUsernameError(null)
              loadData()
            }}
            className="flex-1 py-3.5 rounded-full border border-pink-200 text-gray-600 font-medium hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button 
            onClick={handleSaveAll}
            disabled={saving || !!usernameError}
            className="flex-[2] py-3.5 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium hover:from-pink-600 hover:to-pink-700 transition-all shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
