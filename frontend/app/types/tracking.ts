export type ISODate = `${number}-${number}-${number}` // YYYY-MM-DD

// ---- UserSetup ----
export type ContraceptionMethod =
  | "none"
  | "condom"
  | "pill_combined"
  | "pill_progestin_only"
  | "iud_hormonal"
  | "iud_copper"
  | "implant"
  | "injection"
  | "patch"
  | "ring"
  | "withdrawal"
  | "fertility_awareness"
  | "sterilization"
  | "other"

export type AppGoal =
  | "track_cycle"
  | "predict_period"
  | "manage_symptoms"
  | "conceive"
  | "avoid_pregnancy"
  | "general_health"

export interface UserSetup {
  id: number
  user_id: number
  last_period_start_date: ISODate | null
  avg_period_length_days: number | null
  avg_cycle_length_days: number | null
  contraception_method: ContraceptionMethod
  app_goal: AppGoal
}

export type UserSetupUpsert = Omit<UserSetup, "id" | "user_id">

// ---- DailyLog ----
export type BleedingFlow = "none" | "spotting" | "light" | "medium" | "heavy"

export type DischargeType =
  | "none"
  | "dry"
  | "sticky"
  | "creamy"
  | "watery"
  | "eggwhite"
  | "unusual"

// Keep these as "codes" so you can evolve the taxonomy without schema changes.
export type SymptomCode = string
export type MoodCode = string

export type SexLog = {
  had_sex?: boolean
  protection?: ContraceptionMethod | "unknown"
  orgasm?: boolean
  pain?: boolean
  libido?: "low" | "normal" | "high"
}

export interface DailyLog {
  id: number
  user_id: number
  log_date: ISODate
  bleeding_flow: BleedingFlow
  discharge_type: DischargeType
  physical_symptoms: SymptomCode[]
  moods: MoodCode[]
  sex: SexLog
  bbt_celsius: number | null
  notes?: string | null
}

export type DailyLogUpsert = Omit<DailyLog, "id" | "user_id">

