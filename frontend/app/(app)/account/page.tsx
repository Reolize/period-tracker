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
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  })
  
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
  // New prediction mode state: "auto" | "regular" | "fixed"
  const [predictionMode, setPredictionMode] = useState<"auto" | "regular" | "fixed">("auto")
  // Track if auto prediction is enabled (master toggle)
  const [isAutoPrediction, setIsAutoPrediction] = useState<boolean>(true)
  
  // Manual cycle length for Fixed Number mode (local state only, saved on Apply)
  const [manualCycleLength, setManualCycleLength] = useState<number>(28)
  const [pendingManualCycleLength, setPendingManualCycleLength] = useState<number>(28)
  const [manualCycleInput, setManualCycleInput] = useState<string>("28")
  const [isApplyingFixed, setIsApplyingFixed] = useState<boolean>(false)
  
  // Track user's cycle count for tier display
  const [userCycleCount, setUserCycleCount] = useState<number>(0)
  
  // Prediction mode edit state
  const [isEditingPredictionMode, setIsEditingPredictionMode] = useState<boolean>(false)
  const [pendingPredictionMode, setPendingPredictionMode] = useState<"auto" | "regular" | "fixed">("auto")
  
  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true)
  const [reminderDays, setReminderDays] = useState<number>(3)
  
  // Privacy settings
  const [shareAnonymousData, setShareAnonymousData] = useState<boolean>(true)
  const [anonymousMode, setAnonymousMode] = useState<boolean>(false)
  
  // Prediction data from backend
  const [predictionData, setPredictionData] = useState<any>(null)
  const [predictionLoading, setPredictionLoading] = useState<boolean>(false)

  // Fetch prediction data from backend (uses saved DB values, no query params)
  useEffect(() => {
    fetchPrediction()
  }, [])

  // Fetch prediction from backend (reads saved DB values, no query params needed)
  async function fetchPrediction() {
    setPredictionLoading(true)
    const timestamp = Date.now()
    console.log(`[FRONTEND] Fetching prediction result... (t=${timestamp})`)
    try {
      const res = await apiFetch(`/users/me/next-period-prediction?t=${timestamp}`)
      console.log("[FRONTEND] Prediction received:", res)
      setPredictionData(res)
    } catch (e) {
      console.log("[FRONTEND] Failed to fetch prediction", e)
    } finally {
      setPredictionLoading(false)
    }
  }

  // Auto-save prediction mode - now handles "auto", "regular", "fixed"
  async function savePredictionMode(mode: "auto" | "regular" | "fixed", manualLength?: number) {
    console.log("[FRONTEND] State changed to:", { mode, manualLength })
    try {
      const payload: any = { prediction_mode: mode }
      if (manualLength !== undefined) {
        payload.manual_cycle_length = manualLength
      }
      
      console.log("[FRONTEND] Saving to DB:", payload)
      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify(payload)
      })
      console.log("[FRONTEND] DB save complete, now fetching fresh prediction...")
      
      // Refresh prediction with new saved values
      await fetchPrediction()
      const modeDisplayName = mode === 'auto' ? 'Auto AI Prediction' : mode === 'regular' ? 'Regular Calendar' : 'Fixed Number'
      showToast(`${modeDisplayName} mode activated`, "success")
    } catch (err: any) {
      console.error("[FRONTEND] Failed to save mode:", err)
      showToast("Failed to save mode. Please try again.", "error")
    }
  }

  // Auto-save functions for various settings
  async function saveHealthSetting(setting: string, value: any) {
    try {
      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify({ [setting]: value })
      })
      showToast("Setting updated ✨", "success")
    } catch (err: any) {
      console.error(`Failed to save ${setting}:`, err)
      showToast("Failed to save. Please try again.", "error")
    }
  }

  async function saveProfileSetting(setting: string, value: any) {
    try {
      await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify({ [setting]: value })
      })
      showToast("Setting updated ✨", "success")
    } catch (err: any) {
      console.error(`Failed to save ${setting}:`, err)
      showToast("Failed to save. Please try again.", "error")
    }
  }

  // Handle PCOS/Irregular toggle with auto-save
  async function handlePcosToggle() {
    const newValue = !hasPcosOrIrregular
    setHasPcosOrIrregular(newValue)
    await saveHealthSetting("has_pcos_or_irregular", newValue)
  }

  // Handle Notifications toggle with auto-save
  async function handleNotificationsToggle() {
    const newValue = !notificationsEnabled
    setNotificationsEnabled(newValue)
    await saveHealthSetting("notifications_enabled", newValue)
  }

  // Handle Reminder Days change with auto-save
  async function handleReminderDaysChange(days: number) {
    setReminderDays(days)
    await saveHealthSetting("reminder_days", days)
  }

  // Handle Share Anonymous Data toggle with auto-save
  async function handleShareAnonymousDataToggle() {
    const newValue = !shareAnonymousData
    setShareAnonymousData(newValue)
    await saveProfileSetting("share_anonymous_data", newValue)
  }

  // Handle Anonymous Mode toggle with auto-save
  async function handleAnonymousModeToggle() {
    const newValue = !anonymousMode
    setAnonymousMode(newValue)
    await saveProfileSetting("is_anonymous_mode", newValue)
  }

  // Handle Auto toggle change (master toggle)
  async function handleAutoToggleChange() {
    const newAutoValue = !isAutoPrediction
    setIsAutoPrediction(newAutoValue)
    
    if (newAutoValue) {
      // Turning ON auto - switch to auto mode
      setPredictionMode('auto')
      await savePredictionMode('auto')
    } else {
      // Turning OFF auto - default to regular calendar as manual override
      setPredictionMode('regular')
      await savePredictionMode('regular')
    }
  }

  // Handle manual override mode change (when auto is OFF)
  async function handleManualModeChange(newMode: "regular" | "fixed") {
    console.log(`[FRONTEND] Manual mode selected: ${newMode}`)
    setPredictionMode(newMode)
    if (newMode === 'regular') {
      await savePredictionMode('regular')
    }
    // For fixed mode, just change UI - user will apply the value separately
  }

  // Enter prediction mode edit mode (for manual override settings)
  function enterPredictionModeEdit() {
    console.log("[FRONTEND] Entering prediction mode edit mode")
    setIsEditingPredictionMode(true)
    setPendingPredictionMode(predictionMode)
    if (predictionMode === 'fixed') {
      setPendingManualCycleLength(manualCycleLength)
      setManualCycleInput(String(manualCycleLength))
    }
  }

  // Cancel prediction mode edit
  function cancelPredictionModeEdit() {
    console.log("[FRONTEND] Canceling prediction mode edit")
    setIsEditingPredictionMode(false)
    setPendingPredictionMode(predictionMode)
    setManualCycleInput(String(manualCycleLength))
  }

  // Select manual mode while in edit mode (local only)
  function selectManualModeInEdit(newMode: "regular" | "fixed") {
    console.log("[FRONTEND] Selecting manual mode in edit:", newMode)
    setPendingPredictionMode(newMode)
    if (newMode === 'fixed') {
      setPendingManualCycleLength(manualCycleLength)
      setManualCycleInput(String(manualCycleLength))
    }
  }

  // Apply prediction mode selection
  async function applyPredictionMode() {
    console.log("[FRONTEND] Applying prediction mode:", pendingPredictionMode)
    if (pendingPredictionMode === 'fixed') {
      // For fixed mode, clamp and save with manual length
      const numericValue = parseInt(manualCycleInput) || 28
      const clampedValue = Math.max(21, Math.min(45, numericValue))
      setIsApplyingFixed(true)
      try {
        setManualCycleLength(clampedValue)
        setPendingManualCycleLength(clampedValue)
        setManualCycleInput(String(clampedValue))
        await savePredictionMode('fixed', clampedValue)
        setPredictionMode('fixed')
        setIsAutoPrediction(false) // Fixed is a manual mode
      } finally {
        setIsApplyingFixed(false)
      }
    } else {
      // For regular mode
      setPredictionMode(pendingPredictionMode)
      await savePredictionMode(pendingPredictionMode)
    }
    setIsEditingPredictionMode(false)
  }

  // Apply Fixed Number mode (save to DB)
  async function applyFixedMode() {
    // Clamp value to valid range
    const numericValue = parseInt(manualCycleInput) || 28
    const clampedValue = Math.max(21, Math.min(45, numericValue))
    console.log("[FRONTEND] Apply button clicked for Fixed mode:", clampedValue)
    setIsApplyingFixed(true)
    try {
      setManualCycleLength(clampedValue)
      setPendingManualCycleLength(clampedValue)
      setManualCycleInput(String(clampedValue))
      await savePredictionMode('fixed', clampedValue)
    } finally {
      setIsApplyingFixed(false)
    }
  }

  // Handle manual cycle length input change (free typing, no clamping)
  function handleManualCycleLengthInput(value: string) {
    console.log("[FRONTEND] Manual cycle length input changed:", value)
    setManualCycleInput(value)
    // Don't clamp - let user type freely
  }

  // Handle blur - validate and fix if empty
  function handleManualCycleLengthBlur() {
    const numericValue = parseInt(manualCycleInput)
    if (isNaN(numericValue) || numericValue < 1) {
      setManualCycleInput(String(pendingManualCycleLength))
    }
  }

  // Increment/decrement buttons for mobile
  function incrementCycleLength() {
    const current = parseInt(manualCycleInput) || 28
    const newValue = Math.min(45, current + 1)
    setManualCycleInput(String(newValue))
  }

  function decrementCycleLength() {
    const current = parseInt(manualCycleInput) || 28
    const newValue = Math.max(1, current - 1)
    setManualCycleInput(String(newValue))
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
      
      // Load privacy settings from user profile
      setShareAnonymousData(userRes.share_anonymous_data !== false)
      setAnonymousMode(userRes.is_anonymous_mode || false)
      
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
          // Map legacy modes to new modes if needed
          const loadedMode = setupRes.prediction_mode || "auto"
          // Convert old "smart" to "auto", "strict" to "regular"
          const normalizedMode = loadedMode === "smart" ? "auto" : loadedMode === "strict" ? "regular" : loadedMode
          setPredictionMode(normalizedMode as "auto" | "regular" | "fixed")
          // Auto is ON when mode is "auto"
          setIsAutoPrediction(normalizedMode === "auto")
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
      // Save profile data including privacy settings
      const profilePayload: any = {}
      if (username) profilePayload.username = username
      if (avatarUrl) profilePayload.avatar_url = avatarUrl
      
      // Add privacy settings
      profilePayload.share_anonymous_data = shareAnonymousData
      profilePayload.is_anonymous_mode = anonymousMode
      
      await apiFetch("/users/me", {
        method: "PUT",
        body: JSON.stringify(profilePayload)
      })
      
      // Save ALL settings including prediction mode and manual cycle length
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
      showToast("Settings updated successfully! ✨", "success")
    } catch (err: any) {
      const errorMessage = err.message || "Failed to save changes"
      setUsernameError(errorMessage)
      showToast("Failed to update settings. Please try again.", "error")
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

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type, visible: true })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
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
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg border ${
              toast.type === "success"
                ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white border-pink-400 shadow-pink-200"
                : "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-red-200"
            }`}
          >
            {toast.type === "success" ? (
              <Sparkles size={18} className="text-white" />
            ) : (
              <AlertCircle size={18} className="text-white" />
            )}
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

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
                  onClick={handlePcosToggle}
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

              {/* Prediction Mode - New Master Toggle Design */}
              <div className="py-4 border-b border-gray-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <label className="block font-medium text-gray-800">Prediction Mode</label>
                  {!isEditingPredictionMode && !isAutoPrediction && (
                    <button
                      onClick={enterPredictionModeEdit}
                      className="p-2 rounded-lg hover:bg-pink-50 text-pink-500 transition-colors"
                      title="Edit manual prediction settings"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                </div>

                {/* Master Toggle: Auto AI Prediction */}
                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl border border-violet-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                      <Sparkles size={20} className="text-violet-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 flex items-center gap-2">
                        Auto AI Prediction
                        <span className="px-2 py-0.5 bg-violet-500 text-white text-xs rounded-full font-medium">Recommended</span>
                      </p>
                      <p className="text-xs text-gray-500">Smart tier-based predictions based on your cycle history</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAutoToggleChange}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      isAutoPrediction ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        isAutoPrediction ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* When Auto is ON: Show Tier Status */}
                {isAutoPrediction && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-pink-50 to-violet-50 rounded-xl border border-pink-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700">AI Status</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {predictionData?.mode_label ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              {predictionData.mode_label} active
                            </span>
                          ) : (
                            <span className="text-gray-400">Calculating...</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">Predicted Length</p>
                        <p className="font-bold text-pink-600 text-lg">
                          {predictionLoading ? (
                            <span className="text-gray-400">...</span>
                          ) : predictionData?.average_cycle_length !== undefined && predictionData?.average_cycle_length !== null ? (
                            <>{predictionData.average_cycle_length} <span className="text-sm font-normal text-gray-500">days</span></>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {/* Tier explanation tooltip */}
                    <div className="mt-3 pt-3 border-t border-pink-200/50">
                      <p className="text-xs text-gray-500">
                        Our AI automatically selects the best algorithm based on your data:
                        <span className="block mt-1">• 0-3 cycles: Global ML Model</span>
                        <span className="block">• 4-5 cycles: Bayesian Hybrid</span>
                        <span className="block">• 6+ cycles: Personal WMA</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* When Auto is OFF: Show Manual Override Sub-menu */}
                {!isAutoPrediction && (
                  <div className="mt-4">
                    {isEditingPredictionMode ? (
                      /* Manual Override Edit Mode */
                      <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-1">Manual Override Options</p>
                        
                        {/* Regular Calendar Radio Button */}
                        <button
                          onClick={() => selectManualModeInEdit('regular')}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            pendingPredictionMode === 'regular'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 bg-white hover:border-pink-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            pendingPredictionMode === 'regular' ? 'border-pink-500' : 'border-gray-300'
                          }`}>
                            {pendingPredictionMode === 'regular' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={18} className="text-blue-500" />
                              <h4 className="font-medium text-gray-800">Regular Calendar (Strict WMA)</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Weighted average of your recent cycles with outlier filtering.
                            </p>
                          </div>
                        </button>

                        {/* Fixed Number Radio Button */}
                        <button
                          onClick={() => selectManualModeInEdit('fixed')}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            pendingPredictionMode === 'fixed'
                              ? 'border-pink-500 bg-pink-50'
                              : 'border-gray-200 bg-white hover:border-pink-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            pendingPredictionMode === 'fixed' ? 'border-pink-500' : 'border-gray-300'
                          }`}>
                            {pendingPredictionMode === 'fixed' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Activity size={18} className="text-emerald-500" />
                              <h4 className="font-medium text-gray-800">Fixed Number</h4>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              User-defined cycle length. You control the prediction.
                            </p>
                          </div>
                        </button>

                        {/* Fixed Number Input - Only when fixed is selected */}
                        {pendingPredictionMode === 'fixed' && (
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 mt-2">
                            <label className="block font-medium text-gray-800 mb-2">
                              Your Cycle Length (days)
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={decrementCycleLength}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors"
                                type="button"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                inputMode="numeric"
                                value={manualCycleInput}
                                onChange={(e) => handleManualCycleLengthInput(e.target.value)}
                                onBlur={handleManualCycleLengthBlur}
                                className="w-20 px-3 py-2 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300 text-gray-800 bg-white text-center"
                              />
                              <button
                                onClick={incrementCycleLength}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-100 transition-colors"
                                type="button"
                              >
                                +
                              </button>
                              <span className="text-gray-500">days</span>
                            </div>
                            <p className="text-xs text-emerald-600 mt-2">
                              Standard range: 21-45 days
                            </p>
                          </div>
                        )}

                        {/* Cancel/Apply Buttons */}
                        <div className="flex gap-3 mt-2">
                          <button
                            onClick={cancelPredictionModeEdit}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={applyPredictionMode}
                            disabled={isApplyingFixed}
                            className="flex-1 py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isApplyingFixed ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Save size={16} />
                                Apply
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Manual Override Read-Only Display */
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">Manual Override Active</p>
                        {predictionMode === 'regular' && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                              <Calendar size={20} className="text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">Regular Calendar (Strict WMA)</h4>
                              <p className="text-sm text-gray-500 mt-1">Weighted average of your recent cycles with outlier filtering.</p>
                            </div>
                          </div>
                        )}
                        {predictionMode === 'fixed' && (
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Activity size={20} className="text-emerald-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">Fixed Number</h4>
                              <p className="text-sm text-gray-500 mt-1">User-defined cycle length</p>
                              <p className="mt-2 text-sm">
                                Cycle length: <strong className="text-emerald-600">{manualCycleLength} days</strong>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                  onClick={handleNotificationsToggle}
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
                    onChange={(e) => handleReminderDaysChange(Number(e.target.value))}
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
                  onClick={handleShareAnonymousDataToggle}
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
              <div className="flex items-start justify-between py-4 border-b border-gray-100 gap-4">
                <div>
                  <p className="font-medium text-gray-800">Enable Anonymous Mode</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Disconnect your email and identity from your health logs. Note: You won't be able to recover your data if you lose your device.
                  </p>
                </div>
                <button
                  onClick={handleAnonymousModeToggle}
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

              {/* Privacy Policy Link */}
              <div className="pt-4">
                <a 
                  href="/data-privacy"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  <ShieldCheck size={16} />
                  Read our full Privacy Policy & Trust Center
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button Only - Settings auto-save per section */}
        <div className="flex gap-3 pt-4">
          <button 
            onClick={() => {
              setUsername('')
              setAvatarUrl('')
              setWeightKg('')
              setHeightCm('')
              setHasPcosOrIrregular(false)
              setPredictionMode('auto')
              setIsAutoPrediction(true)
              setManualCycleLength(28)
              setPendingManualCycleLength(28)
              setManualCycleInput('28')
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
        </div>
      </div>
    </div>
  )
}
