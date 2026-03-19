"use client"

import { useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"
import type { AppGoal, ContraceptionMethod, UserSetup, UserSetupUpsert } from "@/app/types/tracking"

type Props = {
  initial?: Partial<UserSetup>
  onSaved?: (saved: UserSetup) => void
  saveEndpoint?: string // default: "/user-setup"
}

const CONTRACEPTION_OPTIONS: { value: ContraceptionMethod, label: string }[] = [
  { value: "none", label: "None" },
  { value: "condom", label: "Condom" },
  { value: "pill_combined", label: "Pill (combined)" },
  { value: "pill_progestin_only", label: "Pill (progestin-only)" },
  { value: "iud_hormonal", label: "IUD (hormonal)" },
  { value: "iud_copper", label: "IUD (copper)" },
  { value: "implant", label: "Implant" },
  { value: "injection", label: "Injection" },
  { value: "patch", label: "Patch" },
  { value: "ring", label: "Ring" },
  { value: "withdrawal", label: "Withdrawal" },
  { value: "fertility_awareness", label: "Fertility awareness" },
  { value: "sterilization", label: "Sterilization" },
  { value: "other", label: "Other" },
]

const APP_GOAL_OPTIONS: { value: AppGoal, label: string }[] = [
  { value: "track_cycle", label: "Track my cycle" },
  { value: "predict_period", label: "Predict next period" },
  { value: "manage_symptoms", label: "Manage symptoms" },
  { value: "conceive", label: "Trying to conceive" },
  { value: "avoid_pregnancy", label: "Avoid pregnancy" },
  { value: "general_health", label: "General health" },
]

function toIntOrNull(v: string) {
  if (v.trim() === "") return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

export default function OnboardingForm({
  initial,
  onSaved,
  saveEndpoint = "/user-setup",
}: Props) {
  const defaults = useMemo(() => {
    return {
      last_period_start_date: initial?.last_period_start_date ?? null,
      avg_period_length_days: initial?.avg_period_length_days ?? null,
      avg_cycle_length_days: initial?.avg_cycle_length_days ?? null,
      contraception_method: (initial?.contraception_method ?? "none") as ContraceptionMethod,
      app_goal: (initial?.app_goal ?? "track_cycle") as AppGoal,
    }
  }, [initial])

  const [lastPeriodStart, setLastPeriodStart] = useState<string>(defaults.last_period_start_date ?? "")
  const [avgPeriodLen, setAvgPeriodLen] = useState<string>(
    defaults.avg_period_length_days == null ? "" : String(defaults.avg_period_length_days)
  )
  const [avgCycleLen, setAvgCycleLen] = useState<string>(
    defaults.avg_cycle_length_days == null ? "" : String(defaults.avg_cycle_length_days)
  )
  const [contraception, setContraception] = useState<ContraceptionMethod>(defaults.contraception_method)
  const [goal, setGoal] = useState<AppGoal>(defaults.app_goal)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const payload: UserSetupUpsert = {
      last_period_start_date: lastPeriodStart ? (lastPeriodStart as any) : null,
      avg_period_length_days: toIntOrNull(avgPeriodLen),
      avg_cycle_length_days: toIntOrNull(avgCycleLen),
      contraception_method: contraception,
      app_goal: goal,
    }

    setSaving(true)
    try {
      const saved = await apiFetch(saveEndpoint, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      onSaved?.(saved as UserSetup)
    } catch (err: any) {
      setError(err?.message ?? "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2 className="section-title">Welcome — quick setup</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">First day of your last period</label>
            <input
              type="date"
              value={lastPeriodStart}
              onChange={(e) => setLastPeriodStart(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Average period length (days)</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={21}
              placeholder="e.g. 5"
              value={avgPeriodLen}
              onChange={(e) => setAvgPeriodLen(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Average cycle length (days)</label>
            <input
              type="number"
              inputMode="numeric"
              min={10}
              max={120}
              placeholder="e.g. 28"
              value={avgCycleLen}
              onChange={(e) => setAvgCycleLen(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="label">Contraception</label>
            <select
              value={contraception}
              onChange={(e) => setContraception(e.target.value as ContraceptionMethod)}
              className="input"
            >
              {CONTRACEPTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Your goal</label>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
            {APP_GOAL_OPTIONS.map((o) => {
              const active = goal === o.value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setGoal(o.value)}
                  className={[
                    "rounded-xl border px-3 py-2 text-sm text-left transition",
                    active ? "bg-pink-50 border-pink-200" : "bg-white border-[var(--border)] hover:bg-pink-50/60",
                  ].join(" ")}
                >
                  <div className="font-medium">{o.label}</div>
                  <div className="text-xs text-gray-500">{o.value}</div>
                </button>
              )
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button disabled={saving} className="btn-primary w-full">
          {saving ? "Saving..." : "Save setup"}
        </button>
      </form>
    </div>
  )
}

