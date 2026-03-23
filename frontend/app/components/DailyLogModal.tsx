"use client"

import { useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api"
import type {
  BleedingFlow,
  ContraceptionMethod,
  DailyLog,
  DailyLogUpsert,
  DischargeType,
  MoodCode,
  SymptomCode,
} from "@/app/types/tracking"

  type Props = {
  defaultDate?: string // ISODate
  initialData?: Partial<DailyLog> | null
  onSaved?: (saved: DailyLog) => void
  onDeleted?: () => void
  saveEndpoint?: string // default: "/daily-logs"
  triggerLabel?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  appGoal?: string
}

const BLEEDING: { value: BleedingFlow, label: string, hint: string }[] = [
  { value: "none", label: "None", hint: "No bleeding" },
  { value: "spotting", label: "Spotting", hint: "Light spots" },
  { value: "light", label: "Light", hint: "Needs light protection" },
  { value: "medium", label: "Medium", hint: "Typical flow" },
  { value: "heavy", label: "Heavy", hint: "Very strong flow" },
]

const DISCHARGE: { value: DischargeType, label: string }[] = [
  { value: "none", label: "None" },
  { value: "dry", label: "Dry" },
  { value: "sticky", label: "Sticky" },
  { value: "creamy", label: "Creamy" },
  { value: "watery", label: "Watery" },
  { value: "eggwhite", label: "Egg white" },
  { value: "unusual", label: "Unusual" },
]

const SYMPTOMS_PAIN: { code: SymptomCode, label: string }[] = [
  { code: "cramps", label: "Cramps" },
  { code: "headache", label: "Headache" },
  { code: "back_pain", label: "Back pain" },
  { code: "breast_tenderness", label: "Breast tenderness" },
  { code: "bloating", label: "Bloating" },
  { code: "fatigue", label: "Fatigue" },
]

const SYMPTOMS_BODY: { code: SymptomCode, label: string }[] = [
  { code: "acne", label: "Acne" },
  { code: "nausea", label: "Nausea" },
  { code: "appetite_changes", label: "Appetite changes" },
  { code: "sleep_issues", label: "Sleep issues" },
]

const SYMPTOMS_PREGNANCY: { code: SymptomCode, label: string }[] = [
  { code: "morning_sickness", label: "Morning sickness" },
  { code: "vomiting", label: "Vomiting" },
  { code: "heartburn", label: "Heartburn" },
  { code: "fetal_movement", label: "Fetal movement" },
  { code: "contractions", label: "Contractions" },
  { code: "spotting_preg", label: "Spotting (Pregnancy)" },
  { code: "swelling", label: "Swelling" },
]

const MOODS: { code: MoodCode, label: string }[] = [
  { code: "happy", label: "Happy" },
  { code: "calm", label: "Calm" },
  { code: "sad", label: "Sad" },
  { code: "anxious", label: "Anxious" },
  { code: "irritable", label: "Irritable" },
  { code: "stressed", label: "Stressed" },
]

function todayISO() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "bg-pink-50 border-pink-200 text-pink-700"
          : "bg-white border-[var(--border)] text-gray-700 hover:bg-pink-50/60",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

export default function DailyLogModal({
  defaultDate,
  initialData,
  onSaved,
  onDeleted,
  saveEndpoint = "/daily-logs",
  triggerLabel = "Log today",
  open,
  onOpenChange,
  hideTrigger = false,
  appGoal,
}: Props) {
  const initialDate = useMemo(() => defaultDate ?? todayISO(), [defaultDate])

  const [internalOpen, setInternalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [logDate, setLogDate] = useState(initialDate)
  const [bleeding, setBleeding] = useState<BleedingFlow>("none")
  const [discharge, setDischarge] = useState<DischargeType>("none")

  const [symptoms, setSymptoms] = useState<SymptomCode[]>([])
  const [moods, setMoods] = useState<MoodCode[]>([])

  const [hadSex, setHadSex] = useState(false)
  const [protection, setProtection] = useState<ContraceptionMethod | "unknown">("unknown")
  const [orgasm, setOrgasm] = useState(false)
  const [painSex, setPainSex] = useState(false)

  const [bbt, setBbt] = useState<string>("")
  const [weight, setWeight] = useState<string>("")
  const [pregWeek, setPregWeek] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  const isControlled = open !== undefined
  const modalOpen = isControlled ? open : internalOpen

  function setModalOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!modalOpen) return

    setLogDate(initialData?.log_date ?? initialDate)
    setBleeding((initialData?.bleeding_flow as BleedingFlow) ?? "none")
    setDischarge((initialData?.discharge_type as DischargeType) ?? "none")
    setSymptoms(initialData?.physical_symptoms ?? [])
    setMoods(initialData?.moods ?? [])
    setBbt(initialData?.bbt_celsius == null ? "" : String(initialData.bbt_celsius))
    setWeight(initialData?.weight_kg == null ? "" : String(initialData.weight_kg))
    setPregWeek(initialData?.pregnancy_week == null ? "" : String(initialData.pregnancy_week))
    setNotes(initialData?.notes ?? "")

    const sex = initialData?.sex ?? {}
    setHadSex(Boolean(sex.had_sex))
    setProtection((sex.protection as ContraceptionMethod | "unknown") ?? "unknown")
    setOrgasm(Boolean(sex.orgasm))
    setPainSex(Boolean(sex.pain))
  }, [initialDate, modalOpen, initialData])

  function reset() {
    setError(null)
    setBleeding("none")
    setDischarge("none")
    setSymptoms([])
    setMoods([])
    setHadSex(false)
    setProtection("unknown")
    setOrgasm(false)
    setPainSex(false)
    setBbt("")
    setWeight("")
    setPregWeek("")
    setNotes("")
  }

  async function save() {
    setError(null)
    const payload: DailyLogUpsert = {
      log_date: logDate as any,
      bleeding_flow: bleeding,
      discharge_type: discharge,
      physical_symptoms: symptoms,
      moods,
      sex: {
        had_sex: hadSex,
        protection: hadSex ? protection : undefined,
        orgasm: hadSex ? orgasm : undefined,
        pain: hadSex ? painSex : undefined,
      },
      bbt_celsius: bbt.trim() ? Number(bbt) : null,
      weight_kg: weight.trim() ? Number(weight) : null,
      pregnancy_week: pregWeek.trim() ? Number(pregWeek) : null,
      notes: notes.trim() ? notes.trim() : null,
    }

    setSaving(true)
    try {
      const saved = await apiFetch(saveEndpoint, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      onSaved?.(saved as DailyLog)
      setModalOpen(false)
      reset()
    } catch (err: any) {
      setError(err?.message ?? "Failed to save daily log")
    } finally {
      setSaving(false)
    }
  }

  async function deleteLog() {
    if (!initialData?.log_date) return
    if (!confirm("Delete this log?")) return

    setSaving(true)
    try {
      await apiFetch(`${saveEndpoint}/${initialData.log_date}`, {
        method: "DELETE",
      })
      onDeleted?.()
      setModalOpen(false)
      reset()
    } catch (err: any) {
      setError(err?.message ?? "Failed to delete daily log")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {!hideTrigger && (
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          {triggerLabel}
        </button>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-[var(--border)] shadow-lg">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Daily log</div>
                <div className="text-sm text-gray-500">Track bleeding, pain, mood, and more</div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  setModalOpen(false)
                  setError(null)
                }}
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[75vh] overflow-auto">
              {/* Date */}
              <section className="space-y-2">
                <div className="font-semibold">Date</div>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="input"
                />
              </section>

              {/* Bleeding */}
              {appGoal !== "track_pregnancy" && (
                <section className="space-y-3">
                  <div>
                    <div className="font-semibold">Bleeding</div>
                    <div className="text-sm text-gray-500">How strong was your flow?</div>
                  </div>
                  <div className="grid sm:grid-cols-5 gap-2">
                    {BLEEDING.map((b) => {
                      const active = bleeding === b.value
                      return (
                        <button
                          key={b.value}
                          type="button"
                          onClick={() => setBleeding(b.value)}
                          className={[
                            "rounded-xl border px-3 py-2 text-left transition",
                            active ? "bg-pink-50 border-pink-200" : "bg-white border-[var(--border)] hover:bg-pink-50/60",
                          ].join(" ")}
                        >
                          <div className="font-medium text-sm">{b.label}</div>
                          <div className="text-xs text-gray-500">{b.hint}</div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Pregnancy Specific Symptoms */}
              {appGoal === "track_pregnancy" && (
                <section className="space-y-3">
                  <div>
                    <div className="font-semibold text-purple-700 flex items-center gap-2">
                      <span className="text-xl">🤰</span> Pregnancy Symptoms
                    </div>
                    <div className="text-sm text-gray-500">Track common symptoms for your stage</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SYMPTOMS_PREGNANCY.map((s) => (
                      <Chip
                        key={s.code}
                        active={symptoms.includes(s.code)}
                        label={s.label}
                        onClick={() => setSymptoms((prev) => toggleInList(prev, s.code))}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Pain + Body symptoms */}
              <section className="space-y-3">
                <div>
                  <div className="font-semibold">Pain</div>
                  <div className="text-sm text-gray-500">Select what you felt today</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS_PAIN.map((s) => (
                    <Chip
                      key={s.code}
                      active={symptoms.includes(s.code)}
                      label={s.label}
                      onClick={() => setSymptoms((prev) => toggleInList(prev, s.code))}
                    />
                  ))}
                </div>

                <div className="pt-2">
                  <div className="font-semibold">Body</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SYMPTOMS_BODY.map((s) => (
                      <Chip
                        key={s.code}
                        active={symptoms.includes(s.code)}
                        label={s.label}
                        onClick={() => setSymptoms((prev) => toggleInList(prev, s.code))}
                      />
                    ))}
                  </div>
                </div>
              </section>

              {/* Mood */}
              <section className="space-y-3">
                <div>
                  <div className="font-semibold">Mood</div>
                  <div className="text-sm text-gray-500">How did you feel emotionally?</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Chip
                      key={m.code}
                      active={moods.includes(m.code)}
                      label={m.label}
                      onClick={() => setMoods((prev) => toggleInList(prev, m.code))}
                    />
                  ))}
                </div>
              </section>

              {/* Discharge + Sex + BBT + Weight */}
              <section className="grid md:grid-cols-2 gap-4">
                {appGoal !== "track_pregnancy" && (
                  <div className="space-y-2">
                    <div className="font-semibold">Discharge</div>
                    <select
                      value={discharge}
                      onChange={(e) => setDischarge(e.target.value as DischargeType)}
                      className="input"
                    >
                      {DISCHARGE.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="font-semibold">Weight (kg)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={20}
                    max={300}
                    placeholder="e.g. 65.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="space-y-2">
                  <div className="font-semibold">BBT (°C)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={30}
                    max={45}
                    placeholder="e.g. 36.55"
                    value={bbt}
                    onChange={(e) => setBbt(e.target.value)}
                    className="input"
                  />
                </div>

                {appGoal === "track_pregnancy" && (
                  <div className="space-y-2">
                    <div className="font-semibold">Pregnancy Week</div>
                    <input
                      type="number"
                      min={0}
                      max={42}
                      placeholder="e.g. 14"
                      value={pregWeek}
                      onChange={(e) => setPregWeek(e.target.value)}
                      className="input"
                    />
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <div className="font-semibold">Sex</div>
                <div className="flex items-center gap-3">
                  <input
                    id="hadSex"
                    type="checkbox"
                    checked={hadSex}
                    onChange={(e) => setHadSex(e.target.checked)}
                  />
                  <label htmlFor="hadSex" className="text-sm text-gray-700">
                    I had sex today
                  </label>
                </div>

                {hadSex && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Protection</label>
                      <select
                        value={protection}
                        onChange={(e) => setProtection(e.target.value as any)}
                        className="input"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="none">None</option>
                        <option value="condom">Condom</option>
                        <option value="pill_combined">Pill (combined)</option>
                        <option value="pill_progestin_only">Pill (progestin-only)</option>
                        <option value="iud_hormonal">IUD (hormonal)</option>
                        <option value="iud_copper">IUD (copper)</option>
                        <option value="implant">Implant</option>
                        <option value="injection">Injection</option>
                        <option value="patch">Patch</option>
                        <option value="ring">Ring</option>
                        <option value="withdrawal">Withdrawal</option>
                        <option value="fertility_awareness">Fertility awareness</option>
                        <option value="sterilization">Sterilization</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          id="orgasm"
                          type="checkbox"
                          checked={orgasm}
                          onChange={(e) => setOrgasm(e.target.checked)}
                        />
                        <label htmlFor="orgasm" className="text-sm text-gray-700">
                          Orgasm
                        </label>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          id="painSex"
                          type="checkbox"
                          checked={painSex}
                          onChange={(e) => setPainSex(e.target.checked)}
                        />
                        <label htmlFor="painSex" className="text-sm text-gray-700">
                          Pain during sex
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <div className="font-semibold">Notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  placeholder="Anything else?"
                  rows={3}
                />
              </section>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[var(--border)] flex items-center gap-3">
              {initialData?.log_date && (
                <button
                  type="button"
                  disabled={saving}
                  className="btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200"
                  onClick={deleteLog}
                >
                  Delete
                </button>
              )}
              <button disabled={saving} className="btn-primary flex-1" onClick={save}>
                {saving ? "Saving..." : "Save daily log"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  reset()
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

