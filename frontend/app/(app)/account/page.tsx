"use client"

import { useState, useEffect } from "react"
import { apiFetch } from "@/lib/api"
import { User, Mail, Calendar, LogOut, ShieldAlert, Edit2, Check, Download, Trash2, Save, RotateCcw, Info, Scale, Ruler, CalendarDays } from "lucide-react"

type CycleRow = {
  id: number
  start_date: string
  end_date: string
  cycle_length: number | null
  period_length: number | null
}

export default function AccountPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState("")

  // Cycle states
  const [cycles, setCycles] = useState<CycleRow[]>([])
  const [setupData, setSetupData] = useState<any>(null)
  
  // Phase 2 states (Manual Override)
  const [isEditingCycle, setIsEditingCycle] = useState(false)
  const [manualCycleLength, setManualCycleLength] = useState(28)
  const [manualPeriodLength, setManualPeriodLength] = useState(5)
  const [isResetToAI, setIsResetToAI] = useState(false)
  const [predictionMethod, setPredictionMethod] = useState<"smart" | "strict">("smart")

  // ML Health Data States
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [heightCm, setHeightCm] = useState<number | "">("")
  const [weightKg, setWeightKg] = useState<number | "">("")
  const [profileSaving, setProfileSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const userRes = await apiFetch("/users/me")
      setEmail(userRes.email)
      
      const setupRes = await apiFetch("/user-setup/")
      setSetupData(setupRes)
      if (setupRes) {
        setManualCycleLength(setupRes.avg_cycle_length_days || 28)
        setManualPeriodLength(setupRes.avg_period_length_days || 5)
        setDateOfBirth(setupRes.date_of_birth || "")
        setHeightCm(setupRes.height_cm || "")
        setWeightKg(setupRes.weight_kg || "")
      }

      const cyclesRes = await apiFetch("/cycles/")
      setCycles(cyclesRes)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to load account data")
    } finally {
      setLoading(false)
    }
  }

  // --- 3-PHASE LOGIC CALCULATION ---
  // Phase 3: Actual Average
  const completedCycles = cycles.filter(c => c.cycle_length !== null)
  const hasActualAverage = completedCycles.length >= 3
  
  let actualAvgCycle = 0
  let actualAvgPeriod = 0
  if (hasActualAverage) {
    actualAvgCycle = Math.round(completedCycles.reduce((sum, c) => sum + (c.cycle_length || 0), 0) / completedCycles.length)
    actualAvgPeriod = Math.round(completedCycles.reduce((sum, c) => sum + (c.period_length || 0), 0) / completedCycles.length)
  }

  // Determine current active phase and values
  let currentCycleLength = 28
  let currentPeriodLength = 5
  let activePhase: "AI" | "Manual" | "Actual" = "AI"

  if (hasActualAverage) {
    activePhase = "Actual"
    currentCycleLength = actualAvgCycle
    currentPeriodLength = actualAvgPeriod
  } else if (setupData?.avg_cycle_length_days) {
    activePhase = "Manual"
    currentCycleLength = setupData.avg_cycle_length_days
    currentPeriodLength = setupData.avg_period_length_days || 5
  } else {
    // Phase 1: AI Predicted (Mocking ML default)
    activePhase = "AI"
    currentCycleLength = 28
    currentPeriodLength = 5
  }

  async function handleSaveCycleSettings() {
    setSaving(true)
    try {
      const payload = {
        ...setupData,
        // If user pressed Reset, we send null to clear the manual override in DB
        avg_cycle_length_days: isResetToAI ? null : manualCycleLength,
        avg_period_length_days: isResetToAI ? null : manualPeriodLength,
      }

      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify(payload)
      })
      
      setIsEditingCycle(false)
      setIsResetToAI(false) // Reset the flag after successful save
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveProfile() {
    setProfileSaving(true)
    try {
      const payload = {
        ...setupData,
        date_of_birth: dateOfBirth || null,
        height_cm: heightCm || null,
        weight_kg: weightKg || null,
      }

      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify(payload)
      })
      
      setIsEditingProfile(false)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3f2b4d] tracking-tight">Account Settings</h1>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <ShieldAlert className="mx-auto text-red-400 mb-3" size={32} />
          <h3 className="text-red-800 font-bold mb-1">Connection Error</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              loadData()
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#3f2b4d] tracking-tight">Account Settings</h1>
        <p className="text-[#7d6b86] mt-2">Manage your profile, cycle preferences, and privacy.</p>
      </div>

      {/* CARD 1: Personal Info */}
      <section className="bg-white rounded-3xl p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-[#3f2b4d] flex items-center gap-2">
            <User className="text-[#ff7eb6]" size={22} />
            Profile Information
          </h2>
          {!isEditingProfile && (
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-[#ff7eb6] hover:text-[#e05896] bg-[#fff0f6] px-4 py-2 rounded-full transition-colors"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>
        
        <div className="space-y-6 max-w-xl">
          {/* Account Credentials */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
            <label className="block text-sm font-medium text-[#7d6b86] mb-1.5">Email Address</label>
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-gray-400" />
              </div>
              <input
                type="email"
                disabled
                value={email}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Your email is used for login and cannot be changed here.</p>
          </div>

          {/* Health & ML Data */}
          <div className="pt-2">
            <h3 className="text-sm font-bold text-[#3f2b4d] mb-4 uppercase tracking-wider">Health Data for AI Prediction</h3>
            
            {isEditingProfile ? (
              <div className="space-y-5 bg-[#faf6f8] p-6 rounded-2xl border border-[#f2d6e4]">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#7d6b86] mb-1.5 flex items-center gap-2">
                      <CalendarDays size={16} className="text-[#b06a94]"/> Date of Birth
                    </label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={e => setDateOfBirth(e.target.value)}
                      className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#7d6b86] mb-1.5 flex items-center gap-2">
                      <Ruler size={16} className="text-[#b06a94]"/> Height (cm)
                    </label>
                    <input
                      type="number"
                      min={50} max={300}
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value ? Number(e.target.value) : "")}
                      className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#7d6b86] mb-1.5 flex items-center gap-2">
                      <Scale size={16} className="text-[#b06a94]"/> Weight (kg)
                    </label>
                    <input
                      type="number"
                      min={20} max={300}
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value ? Number(e.target.value) : "")}
                      className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button 
                    onClick={() => {
                      setIsEditingProfile(false)
                      // Restore original values
                      setDateOfBirth(setupData?.date_of_birth || "")
                      setHeightCm(setupData?.height_cm || "")
                      setWeightKg(setupData?.weight_kg || "")
                    }}
                    className="px-5 py-2.5 rounded-xl border border-[#f0e8ee] text-[#7d6b86] font-medium hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff7eb6] text-white font-medium hover:bg-[#e05896] transition-colors disabled:opacity-50 shadow-sm shadow-[#ff7eb6]/30"
                  >
                    <Save size={16} /> {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-3 gap-6 p-6 bg-white rounded-2xl border border-[#f0e8ee]">
                <div>
                  <p className="text-xs text-[#b06a94] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5"><CalendarDays size={14}/> Born</p>
                  <p className="text-[#3f2b4d] font-medium">{dateOfBirth ? new Date(dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#b06a94] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5"><Ruler size={14}/> Height</p>
                  <p className="text-[#3f2b4d] font-medium">{heightCm ? `${heightCm} cm` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#b06a94] uppercase font-semibold tracking-wider mb-1 flex items-center gap-1.5"><Scale size={14}/> Weight</p>
                  <p className="text-[#3f2b4d] font-medium">{weightKg ? `${weightKg} kg` : "-"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CARD 2: Advanced Cycle Settings (3-Phase) */}
      <section className="bg-white rounded-3xl p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#3f2b4d] flex items-center gap-2">
              <Calendar className="text-[#ff7eb6]" size={22} />
              Cycle Settings
            </h2>
            <div className="flex items-start gap-1.5 mt-1.5 text-[#7d6b86]">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-sm leading-snug">
                How we calculate your predictions. We use AI for initial estimates, and automatically switch to your actual average once you log at least 3 cycles.
              </p>
            </div>
          </div>
          
          {!hasActualAverage && !isEditingCycle && (
            <button 
              onClick={() => setIsEditingCycle(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-[#ff7eb6] hover:text-[#e05896] bg-[#fff0f6] px-4 py-2 rounded-full transition-colors"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}
        </div>

        <div className="bg-[#faf6f8] rounded-2xl p-6 border border-[#f2d6e4]">
          {isEditingCycle ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#7d6b86] mb-1.5">Cycle Length (Days)</label>
                  <input
                    type="number"
                    min={15} max={60}
                    value={manualCycleLength}
                    onChange={e => {
                      setManualCycleLength(Number(e.target.value))
                      setIsResetToAI(false) // User started typing, so it's manual again
                    }}
                    className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7d6b86] mb-1.5">Period Length (Days)</label>
                  <input
                    type="number"
                    min={1} max={15}
                    value={manualPeriodLength}
                    onChange={e => {
                      setManualPeriodLength(Number(e.target.value))
                      setIsResetToAI(false) // User started typing, so it's manual again
                    }}
                    className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end items-center mt-6 pt-6 border-t border-[#f2d6e4]">
                <button 
                  onClick={() => {
                    setManualCycleLength(28)
                    setManualPeriodLength(5)
                    setIsResetToAI(true) // Mark as AI default
                  }}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors mr-auto ${isResetToAI ? 'text-gray-400 cursor-default' : 'text-[#b06a94] hover:text-[#3f2b4d]'}`}
                  disabled={isResetToAI}
                >
                  <RotateCcw size={14} /> {isResetToAI ? "Restored to AI Default" : "Reset to AI Default"}
                </button>
                <button 
                  onClick={() => {
                    setIsEditingCycle(false)
                    setIsResetToAI(false) // Reset flag on cancel
                    // Restore manual values from setupData if user cancels
                    setManualCycleLength(setupData?.avg_cycle_length_days || 28)
                    setManualPeriodLength(setupData?.avg_period_length_days || 5)
                  }}
                  className="px-5 py-2.5 rounded-xl border border-[#f0e8ee] text-[#7d6b86] font-medium hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveCycleSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff7eb6] text-white font-medium hover:bg-[#e05896] transition-colors disabled:opacity-50 shadow-sm shadow-[#ff7eb6]/30"
                >
                  <Save size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#7d6b86]">Cycle Length</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#3f2b4d]">{currentCycleLength}</span>
                  <span className="text-[#7d6b86] pb-1">Days</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-[#7d6b86]">Period Length</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-[#3f2b4d]">{currentPeriodLength}</span>
                  <span className="text-[#7d6b86] pb-1">Days</span>
                </div>
              </div>
            </div>
          )}

          {!isEditingCycle && activePhase === "Actual" && (
            <div className="mt-6 pt-6 border-t border-[#f2d6e4]">
              <p className="text-sm font-medium text-[#3f2b4d] mb-3">Prediction Method</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${predictionMethod === 'smart' ? 'bg-white border-[#ff7eb6] shadow-sm' : 'bg-transparent border-[#f0e8ee] hover:border-[#f2d6e4]'}`}>
                  <input 
                    type="radio" 
                    name="predictionMethod" 
                    checked={predictionMethod === 'smart'}
                    onChange={() => setPredictionMethod('smart')}
                    className="mt-1 accent-[#ff7eb6]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#3f2b4d] flex items-center gap-1.5">
                      <span className="text-[#ff7eb6]">🌟</span> Smart Prediction
                    </p>
                    <p className="text-xs text-[#7d6b86] mt-1 leading-relaxed">
                      Blends your actual average with AI dataset to reduce variations. (Recommended)
                    </p>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${predictionMethod === 'strict' ? 'bg-white border-[#ff7eb6] shadow-sm' : 'bg-transparent border-[#f0e8ee] hover:border-[#f2d6e4]'}`}>
                  <input 
                    type="radio" 
                    name="predictionMethod" 
                    checked={predictionMethod === 'strict'}
                    onChange={() => setPredictionMethod('strict')}
                    className="mt-1 accent-[#ff7eb6]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#3f2b4d] flex items-center gap-1.5">
                      <span>📊</span> Strict Average
                    </p>
                    <p className="text-xs text-[#7d6b86] mt-1 leading-relaxed">
                      Uses 100% pure mathematical average from your past history.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {!isEditingCycle && (
            <div className="mt-6 pt-5 border-t border-[#f2d6e4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {activePhase === "Actual" && <span className="bg-[#eef5ff] text-[#275ea3] border border-[#d7e7ff] text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="text-sm">📊</span> Calculated from actual data</span>}
                {activePhase === "Manual" && <span className="bg-[#fff0de] text-[#9a5a08] border border-[#ffdcbc] text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="text-sm">✍️</span> Custom manual entry</span>}
                {activePhase === "AI" && <span className="bg-[#f6f3f8] text-[#6e5c78] border border-[#ebe3f1] text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5"><span className="text-sm">🤖</span> AI Predicted Default</span>}
              </div>
              
              {activePhase === "Actual" && (
                <p className="text-xs text-[#7d6b86]">Based on your last {completedCycles.length} cycles</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CARD 3: Data Privacy & Export */}
      <section className="bg-white rounded-3xl p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50">
        <h2 className="text-xl font-bold text-[#3f2b4d] mb-6 flex items-center gap-2">
          <ShieldAlert className="text-[#b06a94]" size={22} />
          Data & Privacy
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-[#f0e8ee] rounded-2xl">
            <div>
              <p className="font-semibold text-[#3f2b4d]">Export my data</p>
              <p className="text-sm text-[#7d6b86]">Download a copy of your health logs.</p>
            </div>
            <button className="p-2 text-[#7d6b86] hover:text-[#ff7eb6] hover:bg-[#fff0f6] rounded-xl transition-colors">
              <Download size={20} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-2xl">
            <div>
              <p className="font-semibold text-red-600">Delete Account</p>
              <p className="text-sm text-red-500/70">Permanently delete all your data.</p>
            </div>
            <button className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}