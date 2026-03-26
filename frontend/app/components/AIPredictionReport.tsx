"use client"

import { useState, useEffect } from "react"
import { Brain, TrendingUp, Activity, AlertCircle, Sparkles, Moon, Smile, Zap, Wind } from "lucide-react"
import { apiFetch } from "@/lib/api"

// Types matching the backend API response
interface SymptomProbability {
  probability: number
  based_on_cycles: number
  is_personalized: boolean
  user_occurrence_rate?: number
}

interface LutealPhaseData {
  learned_luteal_phase: number
  ovulation_offset: number
  calculation_method: string
  cycle_deviation_from_standard: number
}

interface AIRecommendation {
  type: "positive" | "warning" | "info"
  message: string
  action?: string
  priority: string
}

interface CycleRegularity {
  std_dev: number
  regularity_level: string
  cycles_logged: number
}

interface AIInsightsResponse {
  symptom_probabilities: Record<string, SymptomProbability>
  luteal_phase: LutealPhaseData | null
  recommendation: AIRecommendation
  cycle_regularity: CycleRegularity | null
}

interface SymptomForecast {
  symptom: string
  probability: number
  icon: React.ReactNode
  color: string
}

// Icon mapping for symptoms
const symptomIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Cramps: { icon: <Zap className="w-5 h-5" />, color: "text-amber-500" },
  Acne: { icon: <Sparkles className="w-5 h-5" />, color: "text-rose-500" },
  "Mood Swing": { icon: <Smile className="w-5 h-5" />, color: "text-purple-500" },
  Bloating: { icon: <Wind className="w-5 h-5" />, color: "text-blue-500" },
  Fatigue: { icon: <Moon className="w-5 h-5" />, color: "text-indigo-500" },
}

// Skeleton Components
function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#f0e8ee] animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200" />
        <div className="h-4 bg-slate-200 rounded w-32" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-20 mb-1" />
      <div className="h-3 bg-slate-200 rounded w-24" />
    </div>
  )
}

function SymptomSkeleton() {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#f0e8ee] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
          <div className="h-2 bg-slate-200 rounded w-full" />
        </div>
        <div className="h-6 bg-slate-200 rounded w-12" />
      </div>
    </div>
  )
}

// Helper to get probability color
function getProbabilityColor(probability: number): string {
  if (probability >= 80) return "bg-rose-500"
  if (probability >= 60) return "bg-amber-500"
  if (probability >= 40) return "bg-yellow-400"
  return "bg-emerald-400"
}

// Helper to get regularity label
function getRegularityLabel(level: string): string {
  switch (level) {
    case "very_regular":
      return "Very Regular ✨"
    case "moderate_variation":
      return "Moderate Variation"
    case "high_variation":
      return "High Variation"
    default:
      return "Learning..."
  }
}

// Main Component
export default function AIPredictionReport() {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        const data = await apiFetch("/cycles/insights")
        setInsights(data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch AI insights:", err)
        setError("Unable to load AI insights. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  // Convert API symptom probabilities to forecast format
  const symptomForecasts: SymptomForecast[] = insights?.symptom_probabilities
    ? Object.entries(insights.symptom_probabilities).map(([symptom, data]) => ({
        symptom,
        probability: data.probability,
        icon: symptomIcons[symptom]?.icon || <Brain className="w-5 h-5" />,
        color: symptomIcons[symptom]?.color || "text-gray-500",
      }))
    : []

  // Get recommendation from API
  const recommendation = insights?.recommendation || {
    type: "info" as const,
    message: "Loading AI recommendations...",
    action: undefined,
    priority: "low",
  }

  // Get luteal phase from API
  const lutealPhase = insights?.luteal_phase

  // Get cycle regularity from API
  const cycleRegularity = insights?.cycle_regularity

  // Calculate confidence score based on data quality
  const confidenceScore = cycleRegularity?.cycles_logged
    ? Math.min(95, 40 + cycleRegularity.cycles_logged * 10)
    : 0

  return (
    <div className="bg-gradient-to-br from-[#fff5f8] via-white to-[#fef0f5] rounded-3xl p-6 md:p-8 border border-[#f0e8ee]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff7eb6] to-[#ff6b9d] flex items-center justify-center shadow-lg shadow-[#ff7eb6]/20">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[#3f2b4d]">
            Your Personalized AI Insights 🤖
          </h2>
          <p className="text-sm text-[#7d6b86]">
            Powered by Machine Learning • Updated in real-time
          </p>
        </div>
      </div>

      {/* Section 1: Personalized Cycle Breakdown */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#ff7eb6]" />
          <h3 className="text-lg font-semibold text-[#3f2b4d]">
            Personalized Cycle Breakdown
          </h3>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Average Cycle Length */}
            <div className="bg-white rounded-2xl p-6 border border-[#f0e8ee] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#fff0f6] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#ff7eb6]" />
                </div>
                <span className="text-sm font-medium text-[#7d6b86]">
                  Average Cycle
                </span>
              </div>
              <div className="text-3xl font-bold text-[#3f2b4d]">
                {cycleRegularity?.cycles_logged
                  ? "~" + Math.round(28 + (lutealPhase?.cycle_deviation_from_standard || 0))
                  : "28"}
                <span className="text-lg font-medium text-[#7d6b86] ml-1">days</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-[#b06a94]">
                  ±{cycleRegularity?.std_dev.toFixed(1) || "2.5"} days variability
                </span>
              </div>
            </div>

            {/* Cycle Regularity */}
            <div className="bg-white rounded-2xl p-6 border border-[#f0e8ee] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#f0f9ff] flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <span className="text-sm font-medium text-[#7d6b86]">
                  Cycle Regularity
                </span>
              </div>
              <div className="text-3xl font-bold text-[#3f2b4d]">
                {(cycleRegularity?.std_dev || 2.5).toFixed(1)}
                <span className="text-lg font-medium text-[#7d6b86] ml-1">SD</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-[#b06a94]">
                  {getRegularityLabel(cycleRegularity?.regularity_level || "")}
                </span>
              </div>
            </div>

            {/* Learned Luteal Phase */}
            <div className="bg-white rounded-2xl p-6 border border-[#f0e8ee] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#f59e0b]" />
                </div>
                <span className="text-sm font-medium text-[#7d6b86]">
                  Learned Luteal Phase
                </span>
              </div>
              <div className="text-3xl font-bold text-[#3f2b4d]">
                -{lutealPhase?.learned_luteal_phase || 14}
                <span className="text-lg font-medium text-[#7d6b86] ml-1">days</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-[#b06a94]">
                  Ovulation offset from period start
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: AI Forecast for Next Cycle */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[#ff7eb6]" />
          <h3 className="text-lg font-semibold text-[#3f2b4d]">
            AI Forecast for Your Next Cycle
          </h3>
          <span className="ml-auto px-3 py-1 bg-[#ff7eb6]/10 text-[#ff7eb6] text-xs font-medium rounded-full">
            {symptomForecasts.some(s => s.probability > 0) ? "AI Personalized" : "Beta"}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(5)].map((_, i) => (
              <SymptomSkeleton key={i} />
            ))}
          </div>
        ) : symptomForecasts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {symptomForecasts.map((forecast: SymptomForecast, index: number) => (
              <div
                key={index}
                className="bg-white rounded-xl p-4 border border-[#f0e8ee] shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center ${forecast.color}`}>
                    {forecast.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#3f2b4d]">{forecast.symptom}</span>
                      <span className={`text-sm font-semibold ${
                        forecast.probability >= 70 ? "text-rose-500" :
                        forecast.probability >= 50 ? "text-amber-500" :
                        "text-emerald-500"
                      }`}>
                        {forecast.probability}%
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProbabilityColor(forecast.probability)}`}
                        style={{ width: `${forecast.probability}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#7d6b86]">
            <p className="text-sm">Log your symptoms to get personalized predictions</p>
          </div>
        )}
      </div>

      {/* Section 3: AI Recommendation */}
      <div className={`rounded-2xl p-6 border-l-4 ${
        recommendation.type === "positive" ? "bg-emerald-50 border-emerald-400" :
        recommendation.type === "warning" ? "bg-amber-50 border-amber-400" :
        "bg-blue-50 border-blue-400"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            recommendation.type === "positive" ? "bg-emerald-100 text-emerald-600" :
            recommendation.type === "warning" ? "bg-amber-100 text-amber-600" :
            "bg-blue-100 text-blue-600"
          }`}>
            {recommendation.type === "positive" ? (
              <Sparkles className="w-6 h-6" />
            ) : recommendation.type === "warning" ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Brain className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[#3f2b4d] mb-1">
              AI Recommendation
            </h4>
            <p className={`text-sm leading-relaxed ${
              recommendation.type === "positive" ? "text-emerald-700" :
              recommendation.type === "warning" ? "text-amber-700" :
              "text-blue-700"
            }`}>
              {recommendation.message}
            </p>
            {recommendation.action && (
              <button className="mt-3 px-4 py-2 bg-white rounded-lg text-sm font-medium text-[#ff7eb6] border border-[#ff7eb6]/20 hover:bg-[#fff0f6] transition-colors">
                {recommendation.action}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-6 text-center">
        <p className="text-xs text-[#b06a94]">
          {cycleRegularity?.cycles_logged
            ? <>AI predictions based on <span className="font-semibold text-[#ff7eb6]">{cycleRegularity.cycles_logged}</span> logged cycles</>
            : "Log cycles for personalized AI predictions"
          }
          {confidenceScore > 0 && (
            <> • Confidence: <span className="font-semibold text-[#ff7eb6]">{confidenceScore}%</span></>
          )}
        </p>
      </div>
    </div>
  )
}
