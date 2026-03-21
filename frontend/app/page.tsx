import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">

      <h1 className="text-5xl font-bold flex items-center gap-3">
        <span className="text-[#ff7eb6]">💧</span> Period Tracker
      </h1>

      <p className="text-gray-500 text-lg">
        Smart cycle prediction powered by Machine Learning
      </p>

      <div className="flex gap-4 mt-6">
        <Link href="/login" className="px-6 py-3 bg-black text-white rounded-lg">
          Login
        </Link>

        <Link href="/register" className="px-6 py-3 border rounded-lg">
          Register
        </Link>
      </div>

    </main>
  )
}