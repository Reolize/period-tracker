import Link from "next/link"
import { Droplet, Sparkles, LineChart, ShieldCheck, ArrowRight, BrainCircuit } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf6f8] text-[#3f2b4d] font-sans selection:bg-[#ff7eb6] selection:text-white flex flex-col">
      
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#f0e8ee]">
        <div className="flex items-center gap-2 text-[#ff7eb6] font-bold text-xl tracking-tight">
          <Droplet fill="currentColor" size={24} />
          <span>Period Tracker</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-[#7d6b86] hover:text-[#3f2b4d] transition-colors">
            Log in
          </Link>
          <Link href="/onboarding" className="text-sm font-semibold bg-[#ff7eb6] hover:bg-[#e05896] text-white px-5 py-2.5 rounded-full transition-all shadow-sm shadow-[#ff7eb6]/30">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative px-6 py-20 lg:px-12 lg:py-32 overflow-hidden bg-gradient-to-b from-[#faf6f8] to-white">
          
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-gradient-to-br from-[#fff0f6] to-[#f7f1ff] rounded-full blur-3xl opacity-80 pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[400px] h-[400px] bg-[#fff0f6] rounded-full blur-3xl opacity-60 pointer-events-none" />

          {/* Container to limit width and keep content balanced */}
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">
            
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fff0f6] text-[#b06a94] text-sm font-semibold mb-6 border border-[#f2d6e4]">
                <Sparkles size={16} />
                <span>Powered by Machine Learning</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Know your body. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff7eb6] to-[#a78bfa]">
                  Predict your cycle.
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-[#7d6b86] mb-10 leading-relaxed max-w-lg">
                Smart tracking, deep insights, and a healthier you. Discover the patterns of your menstrual cycle with our advanced AI-driven app.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/onboarding" className="w-full sm:w-auto bg-[#3f2b4d] hover:bg-[#2a1d33] text-white px-8 py-4 rounded-full text-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#3f2b4d]/20 hover:scale-105">
                  Start Tracking Free
                  <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Right: Hero Visual Mockup (Increased visual weight) */}
            <div className="w-full flex justify-center lg:justify-end relative">
              {/* Added a solid backdrop blob to give weight to the right side */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff7eb6]/10 to-[#a78bfa]/10 rounded-full blur-3xl transform scale-110" />
              
              <div className="relative w-full aspect-square max-w-[550px] drop-shadow-2xl">
                {/* Decorative Circles */}
                <div className="absolute inset-0 rounded-full border-[16px] border-white/60 backdrop-blur-sm shadow-[0_0_40px_rgba(255,126,182,0.15)] animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-6 rounded-full border-[3px] border-dashed border-[#ff7eb6]/30 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-12 rounded-full border border-[#a78bfa]/20" />
                
                {/* Center Content simulating the tracker */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-md w-72 h-72 rounded-full shadow-[0_20px_60px_rgba(63,43,77,0.08)] flex flex-col items-center justify-center p-6 text-center border border-white">
                    <div className="w-12 h-12 bg-[#fff0f6] rounded-full flex items-center justify-center text-[#ff7eb6] mb-3">
                      <Droplet fill="currentColor" size={24} />
                    </div>
                    <p className="text-xs font-bold text-[#b06a94] uppercase tracking-widest mb-1">Period in</p>
                    <p className="text-7xl font-black text-[#3f2b4d] mb-1">4</p>
                    <p className="text-sm font-medium text-[#7d6b86]">Days</p>
                    <div className="mt-5 flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff7eb6] shadow-[0_0_8px_rgba(255,126,182,0.6)]"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff7eb6] shadow-[0_0_8px_rgba(255,126,182,0.6)]"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff7eb6] shadow-[0_0_8px_rgba(255,126,182,0.6)]"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f0e8ee]"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-24 bg-white border-t border-[#f0e8ee]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why choose Period Tracker?</h2>
              <p className="text-[#7d6b86] text-lg max-w-2xl mx-auto">We combine beautiful design with powerful machine learning to give you the most accurate predictions.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              
              {/* Feature 1 */}
              <div className="bg-[#faf6f8] rounded-3xl p-8 border border-[#f0e8ee] hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#f2d6e4]">
                  <BrainCircuit className="text-[#a78bfa]" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Smart Predictions</h3>
                <p className="text-[#7d6b86] leading-relaxed">
                  Our ML algorithm learns from your unique patterns. The more you log, the more accurate your period and ovulation predictions become.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#faf6f8] rounded-3xl p-8 border border-[#f0e8ee] hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#f2d6e4]">
                  <LineChart className="text-[#ff7eb6]" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Deep Insights</h3>
                <p className="text-[#7d6b86] leading-relaxed">
                  Visualize your cycle lengths, identify symptom patterns, and understand your body's rhythm with beautiful, easy-to-read charts.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#faf6f8] rounded-3xl p-8 border border-[#f0e8ee] hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-[#f2d6e4]">
                  <ShieldCheck className="text-[#3f2b4d]" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">Privacy First</h3>
                <p className="text-[#7d6b86] leading-relaxed">
                  Your health data is personal. We use industry-standard security to ensure your information stays private and protected at all times.
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-[#f0e8ee] py-8 text-center">
        <p className="text-[#7d6b86] text-sm">
          © {new Date().getFullYear()} Period Tracker. Designed for your health.
        </p>
      </footer>

    </div>
  )
}