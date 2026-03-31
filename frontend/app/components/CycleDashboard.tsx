"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import DailyLogModal from "@/app/components/DailyLogModal"
import AIPredictionReport from "@/app/components/AIPredictionReport"
import { ChevronDown, ChevronUp, Droplet, Frown, Thermometer, Smile, Pencil } from "lucide-react"

import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

type PredictionAlert = {
  code: string
  level: "info" | "warning" | "critical"
  message: string
}

type PredictionData = {
  predicted_next_start: string
  predicted_next_end: string
  cycle_length_prediction: number
  period_length_prediction: number
  cycle_std_dev: number
  period_std_dev: number
  confidence_score: number
  predicted_ovulation: string
  fertile_window_start: string
  fertile_window_end: string
  health_alerts?: PredictionAlert[] | null
}

type CycleRow = {
  id: number
  start_date: string
  end_date: string
  cycle_length: number | null
  period_length: number | null
}

type DailyLogRow = {
  id: number
  log_date: string
  bleeding_flow: "none" | "spotting" | "light" | "medium" | "heavy"
  discharge_type: string
  physical_symptoms: string[]
  moods: string[]
  sex?: {
    had_sex?: boolean
    [key: string]: any
  }
  bbt_celsius: number | null
  notes?: string | null
}

function toDate(value?: string | null) {
  if (!value) return null
  return new Date(`${value}T00:00:00`)
}

function toLocalISOString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLogText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatDate(value?: string | null) {
  const date = toDate(value)
  if (!date) return "-"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function formatCycleDate(value?: string | null) {
  const date = toDate(value)
  if (!date) return "Ongoing"
  return date.toLocaleDateString('en-GB', { day: "numeric", month: "short", year: "numeric" })
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function getCycleDay(latestStartDate?: string | null) {
  const latest = toDate(latestStartDate)
  if (!latest) return null
  const today = new Date()
  const diff = daysBetween(latest, new Date(today.toDateString()))
  return diff >= 0 ? diff + 1 : null
}

function getFertilityStatus(prediction: PredictionData | null) {
  if (!prediction) return { label: "Unknown", tone: "neutral" as const }

  const today = new Date(new Date().toDateString())
  const ovulation = toDate(prediction.predicted_ovulation)
  const fertileStart = toDate(prediction.fertile_window_start)
  const fertileEnd = toDate(prediction.fertile_window_end)

  if (!ovulation || !fertileStart || !fertileEnd) {
    return { label: "Unknown", tone: "neutral" as const }
  }

  if (today >= fertileStart && today <= fertileEnd) {
    const daysFromOvulation = Math.abs(daysBetween(today, ovulation))
    if (daysFromOvulation <= 1) return { label: "High fertility", tone: "high" as const }
    return { label: "Medium fertility", tone: "medium" as const }
  }

  return { label: "Low fertility", tone: "low" as const }
}

function getPhaseInfo(cycleDay: number | null, cycleLength?: number | null) {
  if (!cycleDay || !cycleLength) {
    return { phase: "Cycle phase", subtitle: "Need more data" }
  }
  const ovulationDay = Math.max(1, cycleLength - 14)
  if (cycleDay <= 5) return { phase: "Period", subtitle: "Menstrual phase" }
  if (cycleDay < ovulationDay - 1) return { phase: "Follicular", subtitle: "Energy often rises" }
  if (Math.abs(cycleDay - ovulationDay) <= 1) return { phase: "Ovulation", subtitle: "Peak fertile days" }
  return { phase: "Luteal", subtitle: "Post-ovulation phase" }
}

function CircularTracker({
  progress,
  cycleDay,
  phase,
  subtitle,
}: {
  progress: number
  cycleDay: number | null
  phase: string
  subtitle: string
}) {
  const normalized = Math.max(0, Math.min(progress, 1))
  const radius = 84
  const stroke = 14
  const size = 220
  const circumference = 2 * Math.PI * radius
  const dash = circumference * normalized

  return (
    <div className="flo-circle-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#f3e7f4"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#trackerGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
        <defs>
          <linearGradient id="trackerGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff8ec8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flo-circle-center">
        <div className="flo-cycle-day">{cycleDay ? `Day ${cycleDay}` : "No data"}</div>
        <div className="flo-phase">{phase}</div>
        <div className="flo-subtitle">{subtitle}</div>
      </div>
    </div>
  )
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#f0e8ee] ${className}`} />
}

function StatusPill({ label, tone }: { label: string; tone: "high" | "medium" | "low" | "neutral" }) {
  let colorClass = "bg-gray-100 text-gray-700"
  if (tone === "high") colorClass = "bg-[#ffebf3] text-[#d64082]"
  if (tone === "medium") colorClass = "bg-[#fff4ea] text-[#9a5a08]"
  if (tone === "low") colorClass = "bg-[#eef2ff] text-[#0284c7]"

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${colorClass}`}>
      {label}
    </span>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-[#faf6f8] rounded-xl p-3 border border-[#f0e8ee]">
      <p className="text-xs text-[#7d6b86] font-semibold uppercase tracking-wider">{title}</p>
      <p className="text-lg font-bold text-[#3f2b4d] mt-0.5">{value}</p>
    </div>
  )
}

export default function CycleDashboard({ userSetup }: { userSetup?: any }) {
  const [prediction, setPrediction] = useState<PredictionData | null>(null)
  const [cycles, setCycles] = useState<CycleRow[]>([])
  const [dailyLogs, setDailyLogs] = useState<DailyLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"history" | "trends">("history")

  const [start, setStart] = useState<Date | null>(null)
  const [end, setEnd] = useState<Date | null>(null)

  const [editing, setEditing] = useState<CycleRow | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const [saving, setSaving] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [calendarActionOpen, setCalendarActionOpen] = useState(false)
  const [dailyLogOpen, setDailyLogOpen] = useState(false)
  const [expandedCycleId, setExpandedCycleId] = useState<number | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [cycleToDelete, setCycleToDelete] = useState<number | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const cyclesData = await apiFetch("/cycles/")
      setCycles(cyclesData)
    } catch (err) {
      console.error(err)
    }
    try {
      const p = await apiFetch("/cycles/predict")
      setPrediction(p)
    } catch {
      setPrediction(null)
    }
    try {
      const logs = await apiFetch("/daily-logs/")
      setDailyLogs(logs ?? [])
    } catch {
      setDailyLogs([])
    }
    try {
      const setupRes = await apiFetch("/user-setup/")
      setPrediction((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          average_cycle_length: setupRes?.avg_cycle_length_days || prev.cycle_length_prediction || null,
          average_period_length: setupRes?.avg_period_length_days || prev.period_length_prediction || null
        }
      })
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Handle URL hash navigation - scroll to calendar section after page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash === '#calendar-section') {
        // Small delay to ensure DOM is fully rendered
        const timer = setTimeout(() => {
          const calendarSection = document.getElementById('calendar-section')
          if (calendarSection) {
            calendarSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Clear the hash without reloading
            window.history.replaceState(null, '', window.location.pathname)
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [loading])

  async function saveCycle(e: React.FormEvent) {
    e.preventDefault()
    if (!start || !end) {
      alert("Select dates")
      return
    }
    const start_date = toLocalISOString(start)
    const end_date = end ? toLocalISOString(end) : null
    setSaving(true)
    try {
      if (editing) {
        await apiFetch(`/cycles/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify({ start_date, end_date })
        })
      } else {
        await apiFetch("/cycles/", {
          method: "POST",
          body: JSON.stringify({ start_date, end_date })
        })
      }
      resetForm()
      setEditModalOpen(false)
      await loadData()
    } catch (err: any) {
      alert(err.message)
    }
    setSaving(false)
  }

  function resetForm() {
    setEditing(null)
    setStart(null)
    setEnd(null)
  }

  async function confirmDelete(id: number) {
    setCycleToDelete(id)
    setDeleteModalOpen(true)
  }

  async function executeDelete() {
    if (!cycleToDelete) return
    try {
      await apiFetch(`/cycles/${cycleToDelete}`, { method: "DELETE" })
      setCycles(prev => prev.filter(c => c.id !== cycleToDelete))
      await loadData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeleteModalOpen(false)
      setCycleToDelete(null)
    }
  }

  async function quickLogPeriodForDate(logDate: string) {
    await apiFetch("/daily-logs/", {
      method: "PUT",
      body: JSON.stringify({
        log_date: logDate,
        bleeding_flow: "medium",
        discharge_type: "none",
        physical_symptoms: [],
        moods: [],
        sex: {},
        bbt_celsius: null,
        notes: "",
      }),
    })
    await loadData()
  }

  function handleCalendarDayClick(date: Date) {
    const iso = toLocalISOString(date)
    setSelectedCalendarDate(iso)
    setCalendarActionOpen(true)
  }

  function handleEdit(cycle: any) {
    setEditing(cycle)
    setStart(new Date(cycle.start_date + "T00:00:00"))
    setEnd(cycle.end_date ? new Date(cycle.end_date + "T00:00:00") : null)
    setEditModalOpen(true)
  }

  function isPeriodDay(date: Date) {
    const d = toLocalISOString(date)
    return cycles.some(c => d >= c.start_date && d <= c.end_date)
  }

  function getLogsForCycle(cycle: CycleRow) {
    return dailyLogs.filter(log => {
      const logDate = log.log_date
      const start = cycle.start_date
      const end = cycle.end_date || "9999-12-31"
      return logDate >= start && logDate <= end
    }).sort((a, b) => a.log_date.localeCompare(b.log_date))
  }

  const latestCycle = cycles.length > 0 ? cycles[0] : null
  const cycleDay = getCycleDay(latestCycle?.start_date)
  const phase = getPhaseInfo(cycleDay, prediction?.cycle_length_prediction)
  const progress = cycleDay && prediction?.cycle_length_prediction
    ? cycleDay / prediction.cycle_length_prediction
    : 0
  const fertility = getFertilityStatus(prediction)
  const todayIso = toLocalISOString(new Date())
  const todayLog = dailyLogs.find((l) => l.log_date === todayIso) ?? null
  const latestLog = dailyLogs[0] ?? null

  const isUnusuallyLongCycle = latestCycle && !latestCycle.end_date && cycleDay && cycleDay > 45

  const hasNoCycles = cycles.length === 0

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flo-hero-card">
          <div className="flo-hero-grid">
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-8 w-56" />
              <SkeletonBlock className="h-4 w-72" />
              <div className="flex gap-2 pt-2">
                <SkeletonBlock className="h-7 w-28 rounded-full" />
                <SkeletonBlock className="h-7 w-32 rounded-full" />
              </div>
            </div>
            <div className="flex justify-center">
              <SkeletonBlock className="h-[220px] w-[220px] rounded-full" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
              <SkeletonBlock className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonBlock className="h-40 w-full rounded-2xl" />
          <SkeletonBlock className="h-40 w-full rounded-2xl lg:col-span-2" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <SkeletonBlock className="h-80 w-full rounded-2xl lg:col-span-2" />
          <SkeletonBlock className="h-80 w-full rounded-2xl" />
        </div>

        <SkeletonBlock className="h-72 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 sm:px-0 mb-6">
        <h1 className="text-3xl font-bold text-[#3f2b4d] tracking-tight">Your Dashboard</h1>
      </div>

      {/* FLO-LIKE HERO */}
      <section className="flo-hero-card">
        <div className="flo-hero-grid">
          <div>
            <p className="flo-kicker">Today</p>
            <h1 className="flo-title">Your cycle overview</h1>
            <p className="flo-muted">
              {cycleDay ? `You are on day ${cycleDay} of your current cycle.` : "Add more cycle entries to improve insights."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {!hasNoCycles && (
                <>
                  <StatusPill
                    label={fertility.label}
                    tone={fertility.tone}
                  />
                  <StatusPill label={`Confidence ${prediction?.confidence_score ?? "-"}%`} tone="neutral" />
                </>
              )}
            </div>
            
            {isUnusuallyLongCycle && (
              <div className="mt-4 bg-[#fff4ea] border border-[#ffe0c2] text-[#9a5a08] p-3 rounded-xl text-sm flex items-start gap-2 animate-pulse">
                <span className="text-lg">⚠️</span>
                <div>
                  <strong>Long cycle detected:</strong> Your current cycle has lasted for {cycleDay} days. Did you forget to log your period?
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <CircularTracker
              progress={progress}
              cycleDay={cycleDay}
              phase={phase.phase}
              subtitle={phase.subtitle}
            />
          </div>

          <div className="space-y-3">
            {hasNoCycles ? (
              <div className="bg-gradient-to-br from-[#fff5f8] via-white to-[#fef0f5] rounded-2xl p-8 border border-[#f0e8ee] shadow-sm h-full flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#ff7eb6]/10 flex items-center justify-center mb-4">
                  <span className="text-3xl">🌸</span>
                </div>
                <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">
                  Ready to get started?
                </h3>
                <p className="text-sm text-[#7d6b86] mb-6 leading-relaxed">
                  We need a little info to calculate your cycle. Log your last period to unlock your predictions.
                </p>
                <button
                  onClick={() => {
                    document.getElementById('calendar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className="px-6 py-3 bg-[#ff7eb6] hover:bg-[#e05896] text-white rounded-xl font-semibold shadow-sm shadow-[#ff7eb6]/30 transition-all w-full"
                >
                  Log your period
                </button>
              </div>
            ) : (
              <>
                <InfoCard title="Next period" value={formatDate(prediction?.predicted_next_start)} />
                <InfoCard title="Ovulation day" value={formatDate(prediction?.predicted_ovulation)} />
                <InfoCard
                  title="Fertile window"
                  value={`${formatDate(prediction?.fertile_window_start)} - ${formatDate(prediction?.fertile_window_end)}`}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS + ALERTS */}
      <section className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 flex flex-col justify-between gap-4">
          <div>
            <h2 className="section-title mb-1">Log today</h2>
            <p className="text-sm text-gray-500">Track bleeding, pain, mood, and BBT in one place.</p>
          </div>
          <DailyLogModal triggerLabel="Add daily log" onSaved={() => loadData()} />
        </div>

        <div className="card lg:col-span-2">
          <h2 className="section-title mb-2">Health insights</h2>
          {prediction?.health_alerts?.length ? (
            <div className="space-y-2">
              {prediction.health_alerts.map((alert) => (
                <div key={alert.code} className={`alert-row alert-${alert.level}`}>
                  <div className="font-medium">{alert.code.replaceAll("_", " ")}</div>
                  <div className="text-sm">{alert.message}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No warning flags right now. Keep logging for more personalized insights.
            </p>
          )}
        </div>
      </section>

      <section className="card dashboard-fade-in">
        <h2 className="section-title mb-2">Today snapshot</h2>
        {todayLog ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoCard title="Bleeding" value={formatLogText(todayLog.bleeding_flow)} />
            <InfoCard title="Mood" value={formatLogText(todayLog.moods[0]) || "-"} />
            <InfoCard title="Symptoms" value={todayLog.physical_symptoms.slice(0, 2).map(formatLogText).join(", ") || "-"} />
            <InfoCard title="BBT" value={todayLog.bbt_celsius != null ? `${todayLog.bbt_celsius}°C` : "-"} />
          </div>
        ) : latestLog ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              No log for today yet. Last log was on {formatDate(latestLog.log_date)}.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard title="Bleeding" value={formatLogText(latestLog.bleeding_flow)} />
              <InfoCard title="Mood" value={formatLogText(latestLog.moods[0]) || "-"} />
              <InfoCard title="Symptoms" value={latestLog.physical_symptoms.slice(0, 2).map(formatLogText).join(", ") || "-"} />
              <InfoCard title="BBT" value={latestLog.bbt_celsius != null ? `${latestLog.bbt_celsius}°C` : "-"} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No daily logs yet. Tap Add daily log to start tracking.</p>
        )}
      </section>

      {/* AI PREDICTION REPORT */}
      <AIPredictionReport />

      {/* MASTER-DETAIL LAYOUT FOR CALENDAR & HISTORY */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* CALENDAR + QUICK CYCLE INPUT */}
        <section id="calendar-section" className="card flex flex-col items-center overflow-hidden w-full">
          <div className="w-full text-left">
            <h2 className="section-title">Cycle calendar</h2>
            <p className="text-sm text-gray-500 mb-6">
              Tap any date to quickly log period or open daily log editor.
            </p>
          </div>
          <div className="w-full flex justify-center pb-4 mt-2">
            <Calendar
              key={JSON.stringify(dailyLogs)} // Force re-render when daily logs change
              value={null} // Prevents internal state from keeping the tile highlighted after closing
              className="custom-calendar compact-calendar"
              tileClassName={({ date }) => {
                const classes: string[] = []
                if (isPeriodDay(date)) classes.push("period-day")
                return classes.join(" ") || undefined
              }}
              onClickDay={handleCalendarDayClick}
            />
          </div>
        </section>

        {/* HISTORY + TRENDS TABS */}
        <section className="card h-full flex flex-col w-full">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="section-title mb-0">Cycle details</h2>
            <div className="tab-wrap">
              <button
                className={`tab-btn ${activeTab === "history" ? "tab-btn-active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                History
              </button>
              <button
                className={`tab-btn ${activeTab === "trends" ? "tab-btn-active" : ""}`}
                onClick={() => setActiveTab("trends")}
              >
                Trends
              </button>
            </div>
          </div>

          <div className="flex-1 mt-2">
            {activeTab === "history" ? (
              <div className="space-y-4">
                {cycles.map(c => {
                  const isExpanded = expandedCycleId === c.id
                  const cycleLogs = getLogsForCycle(c)
                  
                  return (
                    <div key={c.id} className="flex flex-col bg-white rounded-2xl border border-[#f0e8ee] hover:shadow-md transition-shadow overflow-hidden">
                      {/* ACCORDION HEADER */}
                      <div 
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-6 gap-4 cursor-pointer"
                        onClick={() => setExpandedCycleId(isExpanded ? null : c.id)}
                      >
                        <div className="flex-1">
                          <div className="font-bold text-lg sm:text-xl text-[#3f2b4d] tracking-tight flex items-center flex-wrap gap-2">
                            <span>{formatCycleDate(c.start_date)}</span>
                            <span className="text-[#b06a94] font-medium text-sm">→</span>
                            <span>{c.end_date ? formatCycleDate(c.end_date) : "Ongoing"}</span>
                          </div>
                          <div className="text-sm text-[#7d6b86] font-medium mt-1.5">{c.period_length ? `${c.period_length} day period` : "Tracking..."}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(c); }} 
                            className="text-[#ff7eb6] font-medium text-sm hover:text-[#e05896] hover:bg-[#fff0f6] px-4 py-2 rounded-full transition-colors border border-transparent hover:border-[#ff7eb6]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); confirmDelete(c.id); }} 
                            className="text-[#ff5c6b] font-medium text-sm hover:text-[#d94452] hover:bg-[#fff0f4] px-4 py-2 rounded-full transition-colors border border-transparent hover:border-[#ff5c6b]"
                          >
                            Delete
                          </button>
                          <div className="ml-2 text-[#b06a94]">
                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                          </div>
                        </div>
                      </div>

                      {/* ACCORDION CONTENT (DAILY LOGS SUMMARY) */}
                      {isExpanded && (
                        <div className="border-t border-[#f0e8ee] bg-[#faf6f8] p-6 text-sm">
                          <h4 className="font-semibold text-[#3f2b4d] mb-4 flex items-center gap-2">
                            <span className="text-lg">✨</span> Cycle Summary
                          </h4>
                          
                          {cycleLogs.length === 0 ? (
                            <p className="text-[#7d6b86] italic">No daily logs recorded for this cycle.</p>
                          ) : (
                            <div className="space-y-3">
                              {cycleLogs.map(log => {
                                  // Format display string for each day
                                  const dateStr = formatDate(log.log_date)
                                  const flow = log.bleeding_flow !== "none" ? `Flow: ${formatLogText(log.bleeding_flow)}` : ""
                                  const discharge = log.discharge_type !== "none" ? `Discharge: ${formatLogText(log.discharge_type)}` : ""
                                  const symps = log.physical_symptoms.length ? `Symptoms: ${log.physical_symptoms.map(formatLogText).join(", ")}` : ""
                                  const moods = log.moods.length ? `Moods: ${log.moods.map(formatLogText).join(", ")}` : ""
                                  const bbt = log.bbt_celsius ? `BBT: ${log.bbt_celsius}°C` : ""
                                
                                // Skip rendering if it's an empty log
                                if (!flow && !discharge && !symps && !moods && !bbt && !log.notes) return null;

                                return (
                                  <div key={log.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-3 bg-white rounded-xl border border-[#f0e8ee] relative group hover:border-[#f2d6e4] transition-colors">
                                    <div className="font-medium text-[#3f2b4d] whitespace-nowrap min-w-[60px] flex items-center gap-2">
                                      {dateStr}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#7d6b86] flex-1">
                                      {flow && <span className="flex items-center gap-1"><Droplet size={14} className="text-red-400"/> {flow}</span>}
                                      {discharge && <span className="flex items-center gap-1"><Droplet size={14} className="text-blue-300"/> {discharge}</span>}
                                      {symps && <span className="flex items-center gap-1"><Frown size={14} className="text-orange-400"/> {symps}</span>}
                                      {moods && <span className="flex items-center gap-1"><Smile size={14} className="text-yellow-400"/> {moods}</span>}
                                      {bbt && <span className="flex items-center gap-1"><Thermometer size={14} className="text-purple-400"/> {bbt}</span>}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setSelectedCalendarDate(log.log_date)
                                        setDailyLogOpen(true)
                                      }}
                                      className="absolute right-3 top-3 sm:static p-1.5 text-[#7d6b86] hover:text-[#ff7eb6] hover:bg-[#fff0f6] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                                      title="Edit daily log"
                                    >
                                      <Pencil size={16} />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-6 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Average Cycle Length - calculated from actual cycles data */}
                  <div className="bg-[#faf6f8] rounded-2xl p-5 border border-[#f0e8ee] flex flex-col items-center text-center">
                    <span className="text-2xl mb-2">📊</span>
                    <span className="text-sm font-semibold text-[#7d6b86] uppercase tracking-wider mb-1">Avg Cycle</span>
                    <span className="text-2xl font-bold text-[#3f2b4d]">
                      {(() => {
                        const cyclesWithLength = cycles.filter(c => c.cycle_length)
                        if (cyclesWithLength.length === 0) return "-"
                        const avg = cyclesWithLength.reduce((sum, c) => sum + (c.cycle_length || 0), 0) / cyclesWithLength.length
                        return `${Math.round(avg)} Days`
                      })()}
                    </span>
                  </div>

                  {/* Average Period Length - calculated from actual cycles data */}
                  <div className="bg-[#fff0f6] rounded-2xl p-5 border border-[#f2d6e4] flex flex-col items-center text-center">
                    <span className="text-2xl mb-2">🩸</span>
                    <span className="text-sm font-semibold text-[#b06a94] uppercase tracking-wider mb-1">Avg Period</span>
                    <span className="text-2xl font-bold text-[#3f2b4d]">
                      {(() => {
                        const cyclesWithPeriod = cycles.filter(c => c.period_length)
                        if (cyclesWithPeriod.length === 0) return "-"
                        const avg = cyclesWithPeriod.reduce((sum, c) => sum + (c.period_length || 0), 0) / cyclesWithPeriod.length
                        return `${Math.round(avg)} Days`
                      })()}
                    </span>
                  </div>

                  {/* Cycle Status */}
                  <div className="bg-[#f0f9ff] rounded-2xl p-5 border border-[#e0f2fe] flex flex-col items-center text-center">
                    <span className="text-2xl mb-2">⏱️</span>
                    <span className="text-sm font-semibold text-[#0369a1] uppercase tracking-wider mb-1">Status</span>
                    <span className="text-xl font-bold text-[#3f2b4d] mt-1">
                      {(() => {
                        const completedCycles = cycles.filter(c => c.cycle_length && c.period_length)
                        if (completedCycles.length >= 4) return "Regular"
                        if (completedCycles.length >= 2) return "Learning..."
                        return "Needs Data"
                      })()}
                    </span>
                  </div>
                </div>

                <div className="mt-auto text-center pt-4">
                  <a href="/trends" className="inline-flex items-center text-sm font-semibold text-[#ff7eb6] hover:text-[#e05896] transition-colors">
                    View full insights <span className="ml-1">→</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}

      {editModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6 text-[#3f2b4d]">{editing ? "Edit cycle" : "Log cycle"}</h2>
            <form onSubmit={saveCycle} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#3f2b4d]">Start date</label>
                <DatePicker
                  selected={start}
                  onChange={(date: Date | null) => setStart(date)}
                  className="w-full bg-[#faf6f8] border-2 border-transparent focus:border-[#ff7eb6]/20 focus:bg-white rounded-2xl p-4 text-[#3f2b4d] outline-none transition-all"
                  required
                  popperProps={{ strategy: 'fixed' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-[#3f2b4d]">End date</label>
                <DatePicker
                  selected={end}
                  onChange={(date: Date | null) => setEnd(date)}
                  className="w-full bg-[#faf6f8] border-2 border-transparent focus:border-[#ff7eb6]/20 focus:bg-white rounded-2xl p-4 text-[#3f2b4d] outline-none transition-all"
                  isClearable
                  placeholderText="Leave blank if ongoing"
                  popperProps={{ strategy: 'fixed' }}
                />
              </div>
              <div className="flex gap-3 pt-4 mt-2">
                <button type="button" onClick={() => setEditModalOpen(false)} className="px-6 py-3 font-semibold text-[#7d6b86] hover:bg-[#faf6f8] rounded-xl transition-colors flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-[#ff7eb6] hover:bg-[#e05896] text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-[#ff7eb6]/30 transition-all disabled:opacity-50 flex-1">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteModalOpen(false)}>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-[#3f2b4d]">Delete Cycle?</h2>
              <p className="text-[#7d6b86] mb-8 text-sm leading-relaxed">
                This action cannot be undone. All daily logs within this cycle will be kept, but the cycle itself will be removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModalOpen(false)} className="px-6 py-3 font-semibold text-[#7d6b86] hover:bg-[#faf6f8] rounded-xl transition-colors flex-1">
                Cancel
              </button>
              <button onClick={executeDelete} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm shadow-red-500/30 transition-all flex-1">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALENDAR ACTION POPUP (Log Period or Edit Log) */}
      {calendarActionOpen && selectedCalendarDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setCalendarActionOpen(false)}>
          <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl max-w-sm w-full relative overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa]" />
            <h2 className="text-xl font-bold text-[#3f2b4d] mb-1">Calendar action</h2>
            <p className="text-sm text-[#7d6b86] mb-6">
              What would you like to do for <span className="font-semibold text-[#b06a94]">{formatDate(selectedCalendarDate)}</span>?
            </p>

            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 p-4 bg-[#fff0f6] hover:bg-[#ffe6f0] text-[#b06a94] rounded-2xl font-semibold transition-colors group"
                onClick={async () => {
                  setCalendarActionOpen(false)
                  await quickLogPeriodForDate(selectedCalendarDate)
                }}
              >
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Droplet size={18} className="text-[#ff7eb6]" /></div>
                Quick log period
              </button>

              <button
                type="button"
                className="w-full flex items-center gap-3 p-4 bg-[#f0f9ff] hover:bg-[#e0f2fe] text-[#0369a1] rounded-2xl font-semibold transition-colors group"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCalendarActionOpen(false)
                  setTimeout(() => setDailyLogOpen(true), 10) // Small delay to prevent event bubbling issues
                }}
              >
                <div className="bg-white p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Pencil size={18} className="text-[#38bdf8]" /></div>
                Edit daily log
              </button>
            </div>

            <button
              onClick={() => setCalendarActionOpen(false)}
              className="w-full mt-6 py-3 text-sm font-semibold text-[#7d6b86] hover:text-[#3f2b4d] hover:bg-[#faf6f8] rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DAILY LOG MODAL */}
      {dailyLogOpen && selectedCalendarDate && (
        <DailyLogModal
          defaultDate={selectedCalendarDate}
          hideTrigger={true}
          open={dailyLogOpen}
          onOpenChange={setDailyLogOpen}
          onSaved={() => {
            setDailyLogOpen(false)
            loadData()
          }}
          onClose={() => setDailyLogOpen(false)}
        />
      )}
    </div>
  )
}
