import { BrainCircuit, Moon, Wind, Activity } from "lucide-react"

interface AIPredictionReportProps {
  confidenceScore: number
  cycleLength: number
}

export default function AIPredictionReport({ confidenceScore, cycleLength }: AIPredictionReportProps) {
  const safeScore = Number.isFinite(confidenceScore)
    ? Math.max(0, Math.min(100, confidenceScore))
    : 0
  const displayScore = Math.round(safeScore)

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (safeScore / 100) * circumference

  return (
    <div className="bg-gradient-to-br from-[#fff0f6] via-white to-[#f7f1ff] rounded-[2rem] p-6 sm:p-8 border border-[#f0e8ee] shadow-sm shadow-[#f0e8ee]/50 flex flex-col h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-[#3f2b4d] flex items-center gap-2">
          <BrainCircuit className="text-[#a78bfa]" size={22} />
          AI Analysis
        </h3>
        <span className="text-[10px] font-bold text-[#b06a94] uppercase tracking-widest bg-[#fff0f6] px-3 py-1 rounded-full border border-[#f2d6e4]">
          Powered by ML
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center flex-1">
        
        {/* Left: Gauge & Score */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative flex items-center justify-center">
            {/* Background Circle */}
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-[#f2d6e4]"
              />
              {/* Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-[#ff7eb6] transition-all duration-1000 ease-out drop-shadow-md"
              />
            </svg>
            {/* Inner Text */}
            <div className="absolute flex flex-col items-center justify-center mt-1">
              <span className="text-4xl font-black text-[#3f2b4d] tracking-tighter tabular-nums leading-none">
                {displayScore}%
              </span>
              <span className="text-[10px] font-bold text-[#7d6b86] uppercase tracking-widest mt-1">
                Accuracy
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-[#3f2b4d]">Confidence Score</h4>
            <p className="text-sm text-[#7d6b86] mt-1 max-w-[200px] leading-relaxed">
              Based on your logs, our AI is highly confident in your next prediction.
            </p>
          </div>
        </div>

        {/* Right: Lifestyle Impact Analysis */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[#b06a94] uppercase tracking-wider mb-2">Lifestyle Impact</h4>
          
          {/* Sleep */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#f0e8ee] hover:border-[#f2d6e4] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#f0f9ff] text-[#0ea5e9] flex items-center justify-center shrink-0 mt-0.5">
              <Moon size={16} />
            </div>
            <div>
              <p className="text-sm text-[#3f2b4d] font-semibold">Sleep</p>
              <p className="text-xs text-[#7d6b86] mt-0.5 leading-relaxed">
                You averaged 5.5 hours. Low sleep may <span className="text-orange-500 font-medium">delay</span> your cycle by ~1 day.
              </p>
            </div>
          </div>

          {/* Stress */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#f0e8ee] hover:border-[#f2d6e4] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#f0fdf4] text-[#10b981] flex items-center justify-center shrink-0 mt-0.5">
              <Wind size={16} />
            </div>
            <div>
              <p className="text-sm text-[#3f2b4d] font-semibold">Stress</p>
              <p className="text-xs text-[#7d6b86] mt-0.5 leading-relaxed">
                <span className="text-[#10b981] font-medium">Low stress levels</span> are keeping your cycle stable.
              </p>
            </div>
          </div>

          {/* Activity */}
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#f0e8ee] hover:border-[#f2d6e4] transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#fff1f2] text-[#f43f5e] flex items-center justify-center shrink-0 mt-0.5">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-sm text-[#3f2b4d] font-semibold">Activity</p>
              <p className="text-xs text-[#7d6b86] mt-0.5 leading-relaxed">
                Great job! Regular workouts help reduce cramp severity.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
