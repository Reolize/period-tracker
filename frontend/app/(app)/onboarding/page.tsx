"use client"

import { useRouter } from "next/navigation"
import OnboardingForm from "@/app/components/OnboardingForm"

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card">
        <div className="text-2xl font-bold">Set up your tracking</div>
        <div className="text-sm text-gray-500 mt-1">
          You can change these anytime later. This helps predictions and insights.
        </div>
      </div>

      <OnboardingForm
        onSaved={() => {
          router.push("/dashboard")
        }}
      />
    </div>
  )
}

