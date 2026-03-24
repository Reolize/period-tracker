"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ArrowLeft, Check, Target, Heart, Calendar as CalendarIcon, ShieldCheck, Sparkles, Baby } from "lucide-react"

// Import styles and components for dates
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { apiFetch } from "@/lib/api"

export default function OnboardingPage() {
  const router = useRouter()
  
  // -- State: Flow Control --
  const [step, setStep] = useState(1)
  const totalSteps = 5
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // -- State: Form Data --
  // Step 1: Account
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  // Step 2: Goal
  const [appGoal, setAppGoal] = useState<string>("track_cycle")
  
  // Step 3: Pregnancy Setup (Alternative)
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [lastPeriodStart, setLastPeriodStart] = useState<Date | null>(null)
  const [avgCycleLen, setAvgCycleLen] = useState(28)
  const [avgPeriodLen, setAvgPeriodLen] = useState(5)
  
  // Step 4: Health Data
  const [dob, setDob] = useState("")
  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  
  // Step 5: Contraception
  const [contraception, setContraception] = useState("none")

  // -- Handlers --
  const nextStep = () => {
    setError("")
    if (step < totalSteps) setStep(step + 1)
  }
  const prevStep = () => {
    setError("")
    if (step > 1) setStep(step - 1)
  }

  // Handle Step 1: Create Account & Auto Login
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Register
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password })
      })

      // 2. Auto Login to get token
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Bypass-Tunnel-Reminder": "true"
        },
        body: formData.toString()
      })

      if (!loginRes.ok) throw new Error("Login failed after registration")
      
      const data = await loginRes.json()
      localStorage.setItem("token", data.access_token)
      
      // Move to next step
      nextStep()
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Final Step: Save User Setup
  const handleFinalSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const payload = {
        last_period_start_date: lastPeriodStart ? lastPeriodStart.toISOString().split('T')[0] : null,
        avg_period_length_days: avgPeriodLen,
        avg_cycle_length_days: avgCycleLen,
        contraception_method: contraception,
        app_goal: appGoal,
        date_of_birth: dob || null,
        height_cm: height ? parseInt(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        pregnancy_due_date: dueDate ? dueDate.toISOString().split('T')[0] : null,
      }

      await apiFetch("/user-setup/", {
        method: "PUT",
        body: JSON.stringify(payload)
      })

      // Success! Redirect to Dashboard
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Failed to save profile. Please try again.")
      setLoading(false)
    }
  }

  // -- Render Helpers --
  const progressPercentage = ((step - 1) / totalSteps) * 100

  return (
    <div className="min-h-screen bg-[#faf6f8] flex flex-col items-center justify-center p-4 selection:bg-[#ff7eb6] selection:text-white">
      
      {/* Container */}
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl shadow-[#ff7eb6]/5 border border-[#f0e8ee] overflow-hidden relative">
        
        {/* Progress Bar (Hidden on Step 1) */}
        {step > 1 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#f0e8ee]">
            <div 
              className="h-full bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Header / Back Button */}
        <div className="px-6 pt-8 pb-2 flex items-center min-h-[80px]">
          {step > 1 ? (
            <button 
              onClick={prevStep}
              className="text-[#7d6b86] hover:text-[#3f2b4d] p-2 -ml-2 rounded-full hover:bg-[#faf6f8] transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <div className="flex-1 text-center font-bold text-[#b06a94] text-sm uppercase tracking-widest">
            {step === 1 ? "Welcome" : `Step ${step - 1} of ${totalSteps - 1}`}
          </div>
          <div className="w-9" />
        </div>

        {/* Content Area */}
        <div className="px-8 pb-10">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 text-center">
              {error}
            </div>
          )}

          {/* ================= STEP 1: ACCOUNT ================= */}
          {step === 1 && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-[#fff0f6] text-[#ff7eb6] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <ShieldCheck size={32} />
                </div>
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">Let's secure your data</h1>
                <p className="text-[#7d6b86]">Create an account to keep your health data private and synced.</p>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all"
                    placeholder="At least 8 characters"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-6 bg-[#3f2b4d] hover:bg-[#2a1d33] text-white py-4 rounded-2xl font-bold text-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Continue"}
                  {!loading && <ArrowRight size={20} />}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: APP GOAL ================= */}
          {step === 2 && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">What's your main goal?</h1>
                <p className="text-[#7d6b86]">This helps our AI personalize your experience.</p>
              </div>

              <div className="space-y-3">
                {[
                  { id: "track_cycle", label: "Track my cycle", icon: CalendarIcon },
                  { id: "predict_period", label: "Predict my period", icon: Target },
                  { id: "manage_symptoms", label: "Manage symptoms", icon: Heart },
                  { id: "track_pregnancy", label: "Track my pregnancy", icon: Baby },
                ].map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => {
                      setAppGoal(goal.id)
                      setTimeout(nextStep, 300) // Auto advance after tiny delay
                    }}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                      appGoal === goal.id 
                        ? "border-[#ff7eb6] bg-[#fff0f6] text-[#3f2b4d]" 
                        : "border-[#f0e8ee] bg-white text-[#7d6b86] hover:border-[#f2d6e4]"
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${appGoal === goal.id ? "bg-[#ff7eb6] text-white" : "bg-[#faf6f8] text-[#b06a94]"}`}>
                      <goal.icon size={20} />
                    </div>
                    <span className="font-bold text-lg flex-1">{goal.label}</span>
                    {appGoal === goal.id && <Check className="text-[#ff7eb6]" size={24} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 3: CYCLE BASICS OR PREGNANCY ================= */}
          {step === 3 && appGoal !== "track_pregnancy" && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">Tell us about your cycle</h1>
                <p className="text-[#7d6b86] text-sm leading-relaxed">
                  We've set a smart default based on our research. Feel free to adjust it to fit your body.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-2 ml-1">When did your last period start?</label>
                  <DatePicker
                    selected={lastPeriodStart}
                    onChange={(date: Date | null) => setLastPeriodStart(date)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all text-[#3f2b4d]"
                    placeholderText="Select date (optional)"
                    maxDate={new Date()}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3f2b4d] mb-2 ml-1">Cycle length</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={avgCycleLen}
                        onChange={e => setAvgCycleLen(parseInt(e.target.value) || 28)}
                        className="w-full pl-4 pr-14 py-4 rounded-2xl bg-[#faf6f8] border border-transparent focus:bg-white focus:border-[#ff7eb6] outline-none font-bold text-2xl text-[#3f2b4d] transition-all"
                      />
                      <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[#7d6b86] font-medium pointer-events-none">days</span>
                    </div>
                    {avgCycleLen === 28 && (
                      <p className="text-xs text-[#a78bfa] font-medium mt-2 ml-1 flex items-center gap-1">
                        <Sparkles size={12} /> AI estimated default
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3f2b4d] mb-2 ml-1">Period length</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={avgPeriodLen}
                        onChange={e => setAvgPeriodLen(parseInt(e.target.value) || 5)}
                        className="w-full pl-4 pr-14 py-4 rounded-2xl bg-[#faf6f8] border border-transparent focus:bg-white focus:border-[#ff7eb6] outline-none font-bold text-2xl text-[#3f2b4d] transition-all"
                      />
                      <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[#7d6b86] font-medium pointer-events-none">days</span>
                    </div>
                    {avgPeriodLen === 5 && (
                      <p className="text-xs text-[#a78bfa] font-medium mt-2 ml-1 flex items-center gap-1">
                        <Sparkles size={12} /> AI estimated default
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button onClick={nextStep} className="w-full bg-[#3f2b4d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#2a1d33] transition-colors">
                  Confirm and Continue
                </button>
                <button onClick={nextStep} className="w-full py-3 text-[#7d6b86] font-semibold hover:text-[#3f2b4d]">
                  Skip for now, I'll log later
                </button>
              </div>
            </div>
          )}

          {step === 3 && appGoal === "track_pregnancy" && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#fff0f6] text-[#b06a94] rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <Baby size={32} />
                </div>
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">Congratulations!</h1>
                <p className="text-[#7d6b86] text-sm leading-relaxed">
                  Let's set up your pregnancy journey. Do you know your estimated due date?
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-2 ml-1">Estimated Due Date</label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date: Date | null) => setDueDate(date)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all text-[#3f2b4d]"
                    placeholderText="Select due date"
                    minDate={new Date()}
                  />
                </div>
                
                <div className="text-center">
                  <span className="text-[#7d6b86] text-sm font-medium">OR</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-2 ml-1">Calculate from last period</label>
                  <DatePicker
                    selected={lastPeriodStart}
                    onChange={(date: Date | null) => {
                      setLastPeriodStart(date)
                      if (date) {
                        // Rough estimate: LMP + 280 days
                        const estimated = new Date(date)
                        estimated.setDate(estimated.getDate() + 280)
                        setDueDate(estimated)
                      }
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all text-[#3f2b4d]"
                    placeholderText="First day of last period"
                    maxDate={new Date()}
                  />
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={nextStep} 
                  disabled={!dueDate && !lastPeriodStart}
                  className="w-full bg-[#ff7eb6] hover:bg-[#e05896] text-white py-4 rounded-2xl font-bold text-lg transition-colors shadow-md shadow-[#ff7eb6]/20 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: HEALTH DATA ================= */}
          {step === 4 && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">Help AI learn faster</h1>
                <p className="text-[#7d6b86]">Age and body metrics help our models predict hormone levels accurately.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Date of Birth (Optional)</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => setDob(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] focus:ring-4 focus:ring-[#ff7eb6]/10 outline-none transition-all text-[#3f2b4d]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Height (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="e.g. 165"
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] outline-none transition-all text-[#3f2b4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      placeholder="e.g. 55"
                      className="w-full px-4 py-3.5 rounded-2xl bg-[#faf6f8] border-transparent focus:bg-white focus:border-[#ff7eb6] outline-none transition-all text-[#3f2b4d]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <button onClick={nextStep} className="w-full bg-[#3f2b4d] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#2a1d33] transition-colors">
                  Continue
                </button>
                <button onClick={nextStep} className="w-full py-3 text-[#7d6b86] font-semibold hover:text-[#3f2b4d]">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: CONTRACEPTION ================= */}
          {step === 5 && (
            <div className="animate-fadeSlideIn">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-[#3f2b4d] mb-3">Final detail</h1>
                <p className="text-[#7d6b86]">Are you currently using any birth control?</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  { id: "none", label: "No, I don't use any" },
                  { id: "pill_combined", label: "Combined Pill" },
                  { id: "iud_hormonal", label: "Hormonal IUD" },
                  { id: "iud_copper", label: "Copper IUD" },
                  { id: "implant", label: "Implant" },
                  { id: "condom", label: "Condoms only" },
                  { id: "other", label: "Other method" },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setContraception(method.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      contraception === method.id 
                        ? "border-[#ff7eb6] bg-[#fff0f6] text-[#3f2b4d]" 
                        : "border-[#f0e8ee] bg-white text-[#7d6b86] hover:border-[#f2d6e4]"
                    }`}
                  >
                    <span className="font-bold">{method.label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      contraception === method.id ? "border-[#ff7eb6]" : "border-[#e0d4f0]"
                    }`}>
                      {contraception === method.id && <div className="w-2.5 h-2.5 bg-[#ff7eb6] rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>

              <button 
                onClick={handleFinalSubmit} 
                disabled={loading}
                className="w-full mt-8 bg-[#ff7eb6] hover:bg-[#e05896] text-white py-4 rounded-2xl font-bold text-lg transition-colors flex justify-center items-center gap-2 shadow-lg shadow-[#ff7eb6]/30 disabled:opacity-50"
              >
                {loading ? "Personalizing..." : "Finish Setup"}
                {!loading && <Sparkles size={20} />}
              </button>
            </div>
          )}

        </div>
      </div>
      
      {/* Login link for step 1 */}
      {step === 1 && (
        <p className="mt-8 text-[#7d6b86] font-medium">
          Already have an account?{' '}
          <Link href="/login" className="text-[#3f2b4d] font-bold hover:underline">
            Log in here
          </Link>
        </p>
      )}

    </div>
  )
}