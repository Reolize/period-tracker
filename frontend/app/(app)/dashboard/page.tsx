"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import DailyLogModal from "@/app/components/DailyLogModal"
import { ChevronDown, ChevronUp, Droplet, Frown, Thermometer, Smile, Pencil } from "lucide-react"

import Calendar from "react-calendar"
import "react-calendar/dist/Calendar.css"

import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

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

// Helper to get local date string (YYYY-MM-DD)
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

export default function Dashboard() {
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

    setLoading(false)

  }

  useEffect(() => {
    loadData()
  }, [])

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
      // Refresh the rest of the data (predictions, charts, etc.)
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
        notes: "", // Removed the automatic note so it doesn't trigger the dot when all other fields are empty
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
      const end = cycle.end_date || "9999-12-31" // If ongoing, include all logs after start
      return logDate >= start && logDate <= end
    }).sort((a, b) => a.log_date.localeCompare(b.log_date))
  }

  const chartData = cycles.map(c => ({
    date: c.start_date,
    length: c.cycle_length
  }))

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

  // Check if current cycle is unusually long (>45 days)
  const isUnusuallyLongCycle = latestCycle && !latestCycle.end_date && cycleDay && cycleDay > 45

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
              <StatusPill
                label={fertility.label}
                tone={fertility.tone}
              />
              <StatusPill label={`Confidence ${prediction?.confidence_score ?? "-"}%`} tone="neutral" />
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
            <InfoCard title="Next period" value={formatDate(prediction?.predicted_next_start)} />
            <InfoCard title="Ovulation day" value={formatDate(prediction?.predicted_ovulation)} />
            <InfoCard
              title="Fertile window"
              value={`${formatDate(prediction?.fertile_window_start)} - ${formatDate(prediction?.fertile_window_end)}`}
            />
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

      {/* MASTER-DETAIL LAYOUT FOR CALENDAR & HISTORY */}
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* CALENDAR + QUICK CYCLE INPUT */}
        <section className="card flex flex-col items-center overflow-hidden w-full">
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
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedCalendarDate(log.log_date)
                                        setDailyLogOpen(true)
                                      }}
                                      className="absolute right-3 top-3 sm:static p-1.5 text-gray-400 hover:text-[#ff7eb6] hover:bg-[#fff0f6] rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="length" stroke="#ff7eb6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* EDIT MODAL */}

      {editModalOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl p-8 w-full max-w-[420px] shadow-xl border border-[#f0e8ee]">

            <h2 className="text-2xl font-bold text-[#3f2b4d] mb-6">
              Edit Cycle
            </h2>

            <form onSubmit={saveCycle} className="space-y-5">

              <div>

                <label className="block text-sm font-medium text-[#7d6b86] mb-1.5">
                  Start Date
                </label>

                <DatePicker
                  selected={start}
                  onChange={(date: Date | null) => setStart(date)}
                  dateFormat="yyyy-MM-dd"
                  className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-[#7d6b86] mb-1.5">
                  End Date
                </label>

                <DatePicker
                  selected={end}
                  onChange={(date: Date | null) => setEnd(date)}
                  minDate={start || undefined}
                  dateFormat="yyyy-MM-dd"
                  isClearable
                  placeholderText="Ongoing"
                  className="w-full border border-[#f0e8ee] p-3 rounded-xl focus:outline-none focus:border-[#ff7eb6] focus:ring-1 focus:ring-[#ff7eb6] transition-all text-[#3f2b4d]"
                />

              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#f0e8ee] text-[#7d6b86] font-medium hover:bg-[#faf6f8] transition-colors"

                >

                  Cancel </button>

                <button
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-[#ff7eb6] text-white font-medium hover:bg-[#e05896] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#ff7eb6]/30"

                >

                  {saving ? "Saving..." : "Update"} </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[400px] shadow-xl border border-[#f0e8ee] text-center">
            <h2 className="text-2xl font-bold text-[#3f2b4d] mb-3">
              Delete this cycle?
            </h2>
            <p className="text-[#7d6b86] mb-8 text-sm leading-relaxed">
              This will remove the cycle dates from your calendar. Don't worry, your daily logs (symptoms, moods) for these days will not be deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false)
                  setCycleToDelete(null)
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-[#f0e8ee] text-[#7d6b86] font-medium hover:bg-[#faf6f8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-[#ff5c6b] text-white font-medium hover:bg-[#d94452] transition-colors shadow-sm shadow-[#ff5c6b]/30"
              >
                Delete Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {calendarActionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setCalendarActionOpen(false); setSelectedCalendarDate(null); }}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm border border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Calendar action</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">{selectedCalendarDate}</p>
            <div className="space-y-2">
              <button
                className="btn-primary w-full"
                onClick={async () => {
                  if (!selectedCalendarDate) return
                  try {
                    await quickLogPeriodForDate(selectedCalendarDate)
                    setCalendarActionOpen(false)
                    setSelectedCalendarDate(null)
                  } catch (err: any) {
                    alert(err?.message ?? "Failed to log period")
                  }
                }}
              >
                Log period for this day
              </button>
              <button
                className="btn-secondary w-full"
                onClick={() => {
                  setCalendarActionOpen(false)
                  setDailyLogOpen(true)
                }}
              >
                Edit daily log
              </button>
              <button
                className="w-full text-sm text-gray-500 py-1"
                onClick={() => { setCalendarActionOpen(false); setSelectedCalendarDate(null); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DailyLogModal
        hideTrigger
        open={dailyLogOpen}
        onOpenChange={(open) => {
          setDailyLogOpen(open)
          if (!open) setSelectedCalendarDate(null)
        }}
        defaultDate={selectedCalendarDate ?? undefined}
        initialData={(dailyLogs.find((l) => l.log_date === selectedCalendarDate) as any) ?? null}
        onSaved={() => loadData()}
        onDeleted={() => loadData()}
      />

    </div>
  )
}

function InfoCard({ title, value }: { title: string, value: string }) {
  return (
    <div className="flo-info-card">
      <p className="flo-info-title">{title}</p>
      <p className="flo-info-value">{value}</p>
    </div>
  )
}

function StatusPill({
  label,
  tone,
}: {
  label: string
  tone: "high" | "medium" | "low" | "neutral"
}) {
  return <span className={`status-pill status-${tone}`}>{label}</span>
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`dashboard-skeleton ${className ?? ""}`.trim()} />
}
