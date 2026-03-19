"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import DailyLogModal from "@/app/components/DailyLogModal"

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
  bbt_celsius: number | null
  notes?: string | null
}

function toDate(value?: string | null) {
  if (!value) return null
  return new Date(`${value}T00:00:00`)
}

function formatDate(value?: string | null) {
  const date = toDate(value)
  if (!date) return "-"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
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

    const start_date = start.toISOString().slice(0, 10)
    const end_date = end.toISOString().slice(0, 10)

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

  async function deleteCycle(id: number) {

    if (!confirm("Delete cycle?")) return

    try {

      await apiFetch(`/cycles/${id}`, { method: "DELETE" })

      setCycles(prev => prev.filter(c => c.id !== id))

    } catch (err: any) {
      alert(err.message)
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
        notes: "Logged from calendar quick action.",
      }),
    })
    await loadData()
  }

  function handleCalendarDayClick(date: Date) {
    const iso = date.toISOString().slice(0, 10)
    setSelectedCalendarDate(iso)
    setCalendarActionOpen(true)
  }

  function handleEdit(cycle: any) {

    setEditing(cycle)

    setStart(new Date(cycle.start_date + "T00:00:00"))
    setEnd(new Date(cycle.end_date + "T00:00:00"))

    setEditModalOpen(true)

  }

  function isPeriodDay(date: Date) {

    const d = date.toISOString().slice(0, 10)

    return cycles.some(c => d >= c.start_date && d <= c.end_date)

  }

  function hasDailyLogDay(date: Date) {
    const d = date.toISOString().slice(0, 10)
    return dailyLogs.some((l) => l.log_date === d)
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
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayLog = dailyLogs.find((l) => l.log_date === todayIso) ?? null
  const latestLog = dailyLogs[0] ?? null

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
            <InfoCard title="Bleeding" value={todayLog.bleeding_flow} />
            <InfoCard title="Mood" value={todayLog.moods[0] ?? "-"} />
            <InfoCard title="Symptoms" value={todayLog.physical_symptoms.slice(0, 2).join(", ") || "-"} />
            <InfoCard title="BBT" value={todayLog.bbt_celsius != null ? `${todayLog.bbt_celsius}°C` : "-"} />
          </div>
        ) : latestLog ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              No log for today yet. Last log was on {formatDate(latestLog.log_date)}.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoCard title="Bleeding" value={latestLog.bleeding_flow} />
              <InfoCard title="Mood" value={latestLog.moods[0] ?? "-"} />
              <InfoCard title="Symptoms" value={latestLog.physical_symptoms.slice(0, 2).join(", ") || "-"} />
              <InfoCard title="BBT" value={latestLog.bbt_celsius != null ? `${latestLog.bbt_celsius}°C` : "-"} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No daily logs yet. Tap Add daily log to start tracking.</p>
        )}
      </section>

      {/* CALENDAR + QUICK CYCLE INPUT */}
      <section className="grid lg:grid-cols-1 gap-6">
        <div className="card">
          <h2 className="section-title">Cycle calendar</h2>
          <p className="text-sm text-gray-500 mb-3">
            Tap any date to quickly log period or open daily log editor.
          </p>
          <Calendar
            tileClassName={({ date }) => {
              const classes: string[] = []
              if (isPeriodDay(date)) classes.push("period-day")
              if (hasDailyLogDay(date)) classes.push("has-log-day")
              return classes.join(" ") || undefined
            }}
            tileContent={({ date, view }) => {
              if (view !== "month") return null
              if (!hasDailyLogDay(date)) return null
              return <span className="log-dot" />
            }}
            onClickDay={handleCalendarDayClick}
          />
        </div>
      </section>

      {/* HISTORY + TRENDS TABS */}
      <section className="card">
        <div className="flex items-center justify-between gap-3 mb-4">
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

        {activeTab === "history" ? (
          <div className="space-y-2">
            {cycles.map(c => (
              <div key={c.id} className="history-row">
                <div>
                  <div className="font-semibold">{c.start_date} → {c.end_date}</div>
                  <div className="text-xs text-gray-400">{c.period_length ?? "-"} day period</div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleEdit(c)} className="link">Edit</button>
                  <button onClick={() => deleteCycle(c.id)} className="link-delete">Delete</button>
                </div>
              </div>
            ))}
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
      </section>

      {/* EDIT MODAL */}

      {editModalOpen && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl p-6 w-[400px] space-y-4">

            <h2 className="text-lg font-semibold">
              Edit Cycle
            </h2>

            <form onSubmit={saveCycle} className="space-y-4">

              <div>

                <label className="label">
                  Start Date
                </label>

                <DatePicker
                  selected={start}
                  onChange={(date: Date | null) => setStart(date)}
                  dateFormat="yyyy-MM-dd"
                  className="input"
                />

              </div>

              <div>

                <label className="label">
                  End Date
                </label>

                <DatePicker
                  selected={end}
                  onChange={(date: Date | null) => setEnd(date)}
                  minDate={start || undefined}
                  dateFormat="yyyy-MM-dd"
                  className="input"
                />

              </div>

              <div className="flex gap-3">

                <button
                  disabled={saving}
                  className="btn-primary flex-1"

                >

                  {saving ? "Saving..." : "Update"} </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false)
                    resetForm()
                  }}
                  className="btn-secondary"

                >

                  Cancel </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {calendarActionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm border border-[var(--border)]">
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
                onClick={() => setCalendarActionOpen(false)}
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
        onOpenChange={setDailyLogOpen}
        defaultDate={selectedCalendarDate ?? undefined}
        initialData={dailyLogs.find((l) => l.log_date === selectedCalendarDate) ?? null}
        onSaved={() => loadData()}
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
