"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import DailyLogModal from "@/app/components/DailyLogModal"
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

import PregnancyDashboard from "@/app/components/PregnancyDashboard"
import CycleDashboard from "@/app/components/CycleDashboard"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [userSetup, setUserSetup] = useState<any>(null)
  
  // States that were previously in this file will be moved to CycleDashboard
  // For now, we just fetch userSetup to decide which dashboard to show

  async function loadUserGoal() {
    setLoading(true)
    try {
      const setupRes = await apiFetch("/user-setup/")
      setUserSetup(setupRes)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUserGoal()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#7d6b86]">Loading your personalized dashboard...</div>
      </div>
    )
  }

  // Dashboard Switcher Logic
  if (userSetup?.app_goal === "track_pregnancy") {
    return <PregnancyDashboard userSetup={userSetup} />
  }

  return <CycleDashboard userSetup={userSetup} />
}
