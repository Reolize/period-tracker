"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Droplet, Lock, Mail, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin() {
    setError("")
    setLoading(true)

    try {
      const formData = new URLSearchParams()
      formData.append("username", email)
      formData.append("password", password)

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData.toString()
        }
      )

      if (!res.ok) {
        setError("Invalid email or password")
        setLoading(false)
        return
      }

      const data = await res.json()
      localStorage.setItem("token", data.access_token)
      router.push("/dashboard")
    } catch (err) {
      setError("An error occurred. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf6f8] p-4 selection:bg-[#ff7eb6] selection:text-white">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center mb-8 animate-fadeSlideIn">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-[#f2d6e4] mb-4 rotate-3">
            <Droplet fill="#ff7eb6" className="text-[#ff7eb6]" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#3f2b4d] tracking-tight">Welcome Back</h1>
          <p className="text-[#7d6b86] mt-2 text-center">Log in to continue your health journey.</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-[#f0e8ee] animate-fadeSlideIn" style={{ animationDelay: '0.1s' }}>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm border border-red-100 text-center animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#3f2b4d] mb-1.5 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7d6b86] group-focus-within:text-[#ff7eb6] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  className="w-full bg-[#faf6f8] border-2 border-transparent focus:border-[#ff7eb6]/20 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-[#3f2b4d] placeholder-[#b0a0b5] outline-none transition-all"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="text-sm font-semibold text-[#3f2b4d]">Password</label>
                <button className="text-xs font-bold text-[#ff7eb6] hover:text-[#e05896] transition-colors">Forgot?</button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7d6b86] group-focus-within:text-[#ff7eb6] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  className="w-full bg-[#faf6f8] border-2 border-transparent focus:border-[#ff7eb6]/20 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-[#3f2b4d] placeholder-[#b0a0b5] outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#ff7eb6] hover:bg-[#e05896] disabled:bg-[#ff7eb6]/50 text-white font-bold py-4 rounded-2xl shadow-sm shadow-[#ff7eb6]/30 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="mt-8 text-center animate-fadeSlideIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-[#7d6b86] font-medium">
            Don't have an account?{' '}
            <Link href="/onboarding" className="text-[#3f2b4d] font-bold hover:underline">
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
