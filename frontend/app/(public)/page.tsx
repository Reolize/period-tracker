"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {

    const router = useRouter()

    return (

        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white text-center space-y-6">

            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
                <span className="text-[#ff7eb6]">💧</span> Period Tracker
            </h1>

            <p className="text-gray-500 max-w-md">
                Track your cycle, predict your next period,
                and understand your body better.
            </p>

            <div className="flex gap-4">

                <button
                    onClick={() => router.push("/login")}
                    className="bg-black text-white px-6 py-3 rounded-lg"

                >

                    Login </button>

                <button
                    onClick={() => router.push("/register")}
                    className="border px-6 py-3 rounded-lg"

                >

                    Create Account </button>

            </div>

        </div>

    )
}
