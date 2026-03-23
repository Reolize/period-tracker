"use client"

import { useEffect, useState } from "react"
import { Baby, Calendar as CalendarIcon, HeartPulse, Activity, Sparkles, Scale, Thermometer, Plus, Pencil, Info } from "lucide-react"
import DailyLogModal from "@/app/components/DailyLogModal"
import { apiFetch } from "@/lib/api"
import { getPregnancyInfo } from "@/app/lib/pregnancy-constants"

export default function PregnancyDashboard({ userSetup }: { userSetup: any }) {
  const [todayLog, setTodayLog] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dailyLogOpen, setDailyLogOpen] = useState(false)

  // Simple calculation for pregnancy weeks
  const calculateWeeks = () => {
    if (!userSetup?.pregnancy_due_date) return 0
    const due = new Date(userSetup.pregnancy_due_date)
    const today = new Date()
    // Standard pregnancy is 280 days (40 weeks)
    const startOfPregnancy = new Date(due)
    startOfPregnancy.setDate(due.getDate() - 280)
    
    const diffTime = today.getTime() - startOfPregnancy.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diffDays / 7)
    return Math.max(0, weeks > 42 ? 42 : weeks)
  }

  const weeksPregnant = calculateWeeks()
  const progressPercentage = Math.min(100, (weeksPregnant / 40) * 100)
  const pregnancyInfo = getPregnancyInfo(weeksPregnant)

  async function loadTodayLog() {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const logs = await apiFetch(`/daily-logs/${today}`)
      setTodayLog(logs)
    } catch (err) {
      setTodayLog(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTodayLog()
  }, [])

  const formatLogText = (text: string) => {
    return text.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 p-4 sm:p-6 lg:p-8 selection:bg-[#ff7eb6] selection:text-white">
      
      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-0 mb-6">
        <h1 className="text-3xl font-bold text-[#3f2b4d] tracking-tight">Your Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: THE JOURNEY (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* HERO CARD: WEEKS + BABY SIZE */}
          <section className="bg-gradient-to-br from-[#fff0f6] via-[#fff2fb] to-[#f7f1ff] rounded-[2.5rem] p-8 md:p-12 border border-[#f0e8ee] shadow-sm relative overflow-hidden group">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff7eb6]/5 blur-3xl rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            
            <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
              <div className="text-center md:text-left space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm text-[#b06a94] text-xs font-bold uppercase tracking-widest border border-white/50 shadow-sm">
                  <Sparkles size={14} />
                  <span>Your Journey</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <span className="text-8xl font-black text-[#3f2b4d] tracking-tighter leading-none">{weeksPregnant}</span>
                    <span className="text-3xl font-bold text-[#7d6b86]">weeks</span>
                  </div>
                  <p className="text-[#b06a94] font-semibold text-lg italic">
                    Due date: {userSetup?.pregnancy_due_date ? new Date(userSetup.pregnancy_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "Not set"}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3 max-w-sm mx-auto md:mx-0 pt-4">
                  <div className="flex justify-between text-xs font-bold text-[#7d6b86] uppercase tracking-wider">
                    <span>Conception</span>
                    <span>Arrival</span>
                  </div>
                  <div className="h-4 w-full bg-white/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/50 shadow-inner">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa] relative transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/30 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Baby Size Visual */}
              <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#ff7eb6]/10 blur-3xl rounded-full transform scale-150 animate-pulse" />
                  <div className="w-48 h-48 md:w-56 md:h-48 bg-white/80 backdrop-blur-md rounded-[3rem] flex items-center justify-center shadow-xl border border-white relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <span className="text-8xl md:text-9xl animate-floatIn" style={{ animationDuration: '3s' }}>{pregnancyInfo.emoji}</span>
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-[#3f2b4d] tracking-tight">Size of a {pregnancyInfo.sizeLabel}</h3>
                  <p className="text-[#7d6b86] text-sm leading-relaxed max-w-[240px]">
                    {pregnancyInfo.description}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* WEEKLY TIP CARD */}
          <section className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-[#fff0f6] text-[#ff7eb6] rounded-2xl flex items-center justify-center">
                <HeartPulse size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#3f2b4d]">Weekly Health Tip</h3>
                <p className="text-xs text-[#b06a94] font-bold uppercase tracking-widest">Week {weeksPregnant}</p>
              </div>
            </div>
            <p className="text-[#7d6b86] leading-relaxed text-lg italic border-l-4 border-[#ff7eb6]/20 pl-6">
              "{pregnancyInfo.tip}"
            </p>
          </section>
        </div>

        {/* RIGHT COLUMN: DAILY HEALTH HUB (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* TODAY'S LOG CARD */}
          <section className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#faf6f8] text-[#3f2b4d] rounded-xl flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <h3 className="text-xl font-bold text-[#3f2b4d]">Today's Log</h3>
              </div>
              {todayLog && (
                <button 
                  onClick={() => setDailyLogOpen(true)}
                  className="p-2 text-[#7d6b86] hover:text-[#ff7eb6] hover:bg-[#fff0f6] rounded-full transition-colors"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff7eb6]" />
              </div>
            ) : todayLog ? (
              <div className="space-y-6 flex-1">
                {/* Symptoms Summary */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#b06a94] uppercase tracking-widest">Logged Symptoms</p>
                  <div className="flex flex-wrap gap-2">
                    {todayLog.physical_symptoms?.length > 0 ? (
                      todayLog.physical_symptoms.map((s: string) => (
                        <span key={s} className="px-3 py-1.5 bg-[#faf6f8] text-[#3f2b4d] text-sm font-medium rounded-full border border-[#f0e8ee]">
                          {formatLogText(s)}
                        </span>
                      ))
                    ) : (
                      <p className="text-[#7d6b86] text-sm italic">No symptoms logged today.</p>
                    )}
                  </div>
                </div>

                {/* Health Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#faf6f8]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#7d6b86]">
                      <Scale size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Weight</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3f2b4d]">{todayLog.weight_kg ? `${todayLog.weight_kg} kg` : "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[#7d6b86]">
                      <Thermometer size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider">Temp</span>
                    </div>
                    <p className="text-2xl font-bold text-[#3f2b4d]">{todayLog.bbt_celsius ? `${todayLog.bbt_celsius}°C` : "-"}</p>
                  </div>
                </div>

                {/* Notes */}
                {todayLog.notes && (
                  <div className="pt-4 border-t border-[#faf6f8]">
                    <p className="text-xs font-bold text-[#b06a94] uppercase tracking-widest mb-2">Personal Notes</p>
                    <p className="text-[#7d6b86] text-sm leading-relaxed line-clamp-3 italic">
                      "{todayLog.notes}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
                <div className="w-24 h-24 bg-[#fff0f6] text-[#ff7eb6] rounded-full flex items-center justify-center shadow-inner">
                  <Plus size={40} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-[#3f2b4d]">Empty log today</h4>
                  <p className="text-[#7d6b86] text-sm max-w-[200px] mx-auto leading-relaxed">
                    Recording your daily symptoms and weight helps our AI provide better insights.
                  </p>
                </div>
                <button 
                  onClick={() => setDailyLogOpen(true)}
                  className="w-full bg-[#ff7eb6] hover:bg-[#e05896] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#ff7eb6]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Log today's data
                </button>
              </div>
            )}
          </section>

          {/* Quick Info / Next Scan (Mock) */}
          <section className="bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] rounded-[2rem] p-6 border border-[#e0f2fe] flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0369a1] shadow-sm">
              <CalendarIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0369a1] uppercase tracking-widest">Next Appointment</p>
              <p className="text-[#3f2b4d] font-bold">Add to your calendar</p>
            </div>
          </section>
        </div>

      </div>

      {/* DAILY LOG MODAL */}
      {dailyLogOpen && (
        <DailyLogModal
          onSaved={(saved) => {
            setTodayLog(saved)
            setDailyLogOpen(false)
          }}
          onOpenChange={setDailyLogOpen}
          open={dailyLogOpen}
          hideTrigger={true}
          appGoal={userSetup?.app_goal}
          initialData={todayLog}
        />
      )}
    </div>
  )
}