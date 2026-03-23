"use client"

import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts"
import { Download, Sparkles, Activity, Calendar, BrainCircuit, ArrowRight } from "lucide-react"
import { apiFetch } from "@/lib/api"

// Helper function to format month (e.g. "2023-10-01" -> "Oct")
function formatMonth(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

export default function TrendsPage() {
  const [loading, setLoading] = useState(true)
  const [cycles, setCycles] = useState<any[]>([])
  const [prediction, setPrediction] = useState<any>(null)
  
  // Mock data for Top Symptoms (since backend doesn't have an endpoint for this aggregation yet)
  const topSymptoms = [
    { name: "Cramps", days: 8, timeframe: "Usually Days 1-3", percentage: 80 },
    { name: "Fatigue", days: 5, timeframe: "Usually Days 25-28", percentage: 50 },
    { name: "Bloating", days: 4, timeframe: "Usually Days 26-28", percentage: 40 },
    { name: "Headache", days: 3, timeframe: "Usually Days 1-2", percentage: 30 },
  ]

  useEffect(() => {
    async function loadData() {
      try {
        const cyRes = await apiFetch("/cycles/")
        // Get last 6 completed cycles and reverse to show chronological order
        const completedCycles = cyRes.filter((c: any) => c.cycle_length !== null).slice(0, 6).reverse()
        setCycles(completedCycles)

        const prRes = await apiFetch("/cycles/predict")
        setPrediction(prRes)
      } catch (error) {
        console.error("Failed to load trends data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Prepare chart data
  const chartData = cycles.map(c => ({
    name: formatMonth(c.start_date),
    length: c.cycle_length,
    isCurrent: false // Could highlight current month if needed
  }))

  const avgCycleLength = prediction?.cycle_length_prediction || 28

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading your insights...</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 p-4 sm:p-6 lg:p-8">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#3f2b4d] tracking-tight flex items-center gap-3">
          <Activity className="text-[#ff7eb6]" size={28} />
          Your Insights
        </h1>
        <p className="text-[#7d6b86] mt-2 text-lg">Understand your body's unique patterns over time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Cycle Trends (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#3f2b4d] flex items-center gap-2">
                <Calendar className="text-[#b06a94]" size={20} />
                Cycle Length Trends
              </h2>
              <p className="text-sm text-[#7d6b86] mt-1">Your last {cycles.length} cycles</p>
            </div>
            <div className="bg-[#faf6f8] px-4 py-2 rounded-xl border border-[#f0e8ee] text-center">
              <span className="block text-xs font-semibold text-[#7d6b86] uppercase tracking-wider">Average</span>
              <span className="block text-lg font-bold text-[#ff7eb6]">{Math.round(avgCycleLength)} Days</span>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7d6b86', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7d6b86', fontSize: 12 }} 
                    domain={[0, Math.max(45, ...chartData.map(d => d.length))]}
                  />
                  <Tooltip 
                    cursor={{ fill: '#faf6f8' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  />
                  <ReferenceLine 
                    y={avgCycleLength} 
                    stroke="#a78bfa" 
                    strokeDasharray="5 5" 
                    label={{ position: 'right', value: 'Avg', fill: '#a78bfa', fontSize: 12 }} 
                  />
                  <Bar dataKey="length" radius={[6, 6, 6, 6]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#ff7eb6' : '#f2d6e4'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#7d6b86]">
                Not enough data to show trends yet.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AI & Export */}
        <div className="space-y-6">
          
          {/* Card 3: AI Prediction */}
          <div className="bg-gradient-to-br from-[#fff0f6] to-[#f7f1ff] rounded-3xl p-6 border border-[#f0e8ee] shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-[#b06a94] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={16} />
              AI Analysis
            </h3>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[#3f2b4d] font-semibold mb-1">Confidence Score</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[#ff7eb6]">{prediction?.confidence_score || 0}%</span>
                  <span className="text-sm text-[#7d6b86] mb-1 pb-1">High</span>
                </div>
              </div>
              <div className="text-[#ff7eb6] opacity-30 shrink-0">
                <BrainCircuit size={48} strokeWidth={1.5} />
              </div>
            </div>
            
            <p className="text-sm text-[#7d6b86] leading-relaxed">
              Based on your last {cycles.length} cycles, your predictions are highly accurate. Keep logging to maintain this score.
            </p>
          </div>

          {/* Card 4: Export Data */}
          <div className="bg-white rounded-3xl p-6 border border-[#f0e8ee] shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-[#faf6f8] rounded-full flex items-center justify-center text-[#3f2b4d]">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#3f2b4d]">Health Report</h3>
              <p className="text-xs text-[#7d6b86] mt-1">Export your data for your doctor</p>
            </div>
            <button className="w-full bg-[#3f2b4d] hover:bg-[#2a1d33] text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 mt-2">
              Download PDF
            </button>
          </div>

        </div>

        {/* BOTTOM FULL WIDTH: Top Symptoms */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50">
          <h2 className="text-xl font-bold text-[#3f2b4d] mb-6">Top Symptoms Pattern</h2>
          
          <div className="space-y-6">
            {topSymptoms.map((symptom, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                
                {/* Symptom Name & Frequency */}
                <div className="sm:w-48 shrink-0">
                  <div className="font-bold text-[#3f2b4d]">{symptom.name}</div>
                  <div className="text-sm text-[#7d6b86]">{symptom.days} days total</div>
                </div>

                {/* Progress Bar Area */}
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-[#faf6f8] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa]" 
                      style={{ width: `${symptom.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-[#b06a94] flex justify-end">
                    {symptom.timeframe}
                  </div>
                </div>

              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[#f0e8ee] text-center">
             <button className="text-sm font-semibold text-[#ff7eb6] hover:text-[#e05896] transition-colors inline-flex items-center gap-1">
               Log today's symptoms <ArrowRight size={14} />
             </button>
          </div>

        </div>

      </div>
    </div>
  )
}