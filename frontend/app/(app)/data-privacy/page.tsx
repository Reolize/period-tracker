"use client"

import { useState } from "react"
import { ShieldCheck, Lock, EyeOff, UserX, Check, Sparkles, ChevronRight, Fingerprint } from "lucide-react"

export default function DataPrivacyPage() {
  const [shareData, setShareData] = useState(true)
  const [anonymousMode, setAnonymousMode] = useState(false)

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 p-4 sm:p-6 lg:p-8 selection:bg-[#ff7eb6] selection:text-white">
      
      {/* Hero Section */}
      <div className="text-center pt-8 pb-4">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-[#ff7eb6] blur-2xl opacity-20 rounded-full" />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-[#fff0f6] shadow-xl relative z-10">
            <ShieldCheck className="text-[#ff7eb6]" size={48} strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3f2b4d] tracking-tight mb-4">
          Your data, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa]">perfectly safe.</span>
        </h1>
        <p className="text-[#7d6b86] text-lg max-w-xl mx-auto leading-relaxed">
          We believe your health data belongs to you. Our security measures are built to protect your most intimate information at all costs.
        </p>
      </div>

      {/* Privacy Promises (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Promise 1 */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#fff0f6] text-[#ff7eb6] rounded-2xl flex items-center justify-center mb-6">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">End-to-End Encrypted</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            Your personal logs and cycle data are encrypted. Not even our team can read your sensitive health entries.
          </p>
        </div>

        {/* Promise 2 */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#f0f9ff] text-[#0369a1] rounded-2xl flex items-center justify-center mb-6">
            <EyeOff size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">Never Sold</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            We will never sell your health data to third parties, advertisers, or data brokers. Your privacy is our business model.
          </p>
        </div>

        {/* Promise 3 */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#f7f1ff] text-[#a78bfa] rounded-2xl flex items-center justify-center mb-6">
            <UserX size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">Anonymous Mode</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            Use the app without an email or name. Your data stays on your device, completely detached from your real identity.
          </p>
        </div>

      </div>

      {/* Privacy Controls (Settings) */}
      <div className="bg-white rounded-[2rem] border border-[#f0e8ee] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#f0e8ee] bg-[#faf6f8]/50">
          <h2 className="text-2xl font-bold text-[#3f2b4d] flex items-center gap-2">
            <Fingerprint className="text-[#b06a94]" size={24} />
            Privacy Controls
          </h2>
          <p className="text-[#7d6b86] mt-2">Manage how your data is handled within the app.</p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Toggle 1 */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-[#3f2b4d] flex items-center gap-2 mb-1">
                Share anonymous data for AI
                <Sparkles size={16} className="text-[#ff7eb6]" />
              </h3>
              <p className="text-sm text-[#7d6b86] leading-relaxed">
                Allow our machine learning models to learn from your cycle lengths to improve predictions for everyone. Your data is stripped of all personal identifiers.
              </p>
            </div>
            {/* Toggle Switch UI */}
            <button 
              onClick={() => setShareData(!shareData)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7eb6] focus-visible:ring-offset-2 ${
                shareData ? 'bg-[#ff7eb6]' : 'bg-[#e0d4f0]'
              }`}
            >
              <span className="sr-only">Use setting</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  shareData ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-[#f0e8ee] w-full" />

          {/* Toggle 2 */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-[#3f2b4d] mb-1">
                Enable Anonymous Mode
              </h3>
              <p className="text-sm text-[#7d6b86] leading-relaxed">
                Disconnect your email and identity from your health logs. Note: You won't be able to recover your data if you lose your device.
              </p>
            </div>
            {/* Toggle Switch UI */}
            <button 
              onClick={() => setAnonymousMode(!anonymousMode)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7eb6] focus-visible:ring-offset-2 ${
                anonymousMode ? 'bg-[#3f2b4d]' : 'bg-[#e0d4f0]'
              }`}
            >
              <span className="sr-only">Use setting</span>
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  anonymousMode ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>

        {/* Action Button */}
        <div className="p-6 bg-[#faf6f8] border-t border-[#f0e8ee]">
           <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white border border-[#f0e8ee] rounded-xl text-[#3f2b4d] font-semibold hover:border-[#ff7eb6] hover:text-[#ff7eb6] transition-colors ml-auto shadow-sm">
             Read Full Privacy Policy <ChevronRight size={18} />
           </button>
        </div>
      </div>

    </div>
  )
}