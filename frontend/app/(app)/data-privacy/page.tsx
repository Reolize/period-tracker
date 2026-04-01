"use client"

import { ShieldCheck, Lock, EyeOff, UserX, FileText, Server, Globe, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function TrustCenterPage() {
  const router = useRouter()

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16 p-4 sm:p-6 lg:p-8 selection:bg-[#ff7eb6] selection:text-white">
      
      {/* Back Button */}
      <button 
        onClick={() => router.push("/account")}
        className="flex items-center gap-2 text-[#7d6b86] hover:text-[#3f2b4d] transition-colors pt-4"
      >
        <ChevronLeft size={20} />
        <span>Back to Account</span>
      </button>

      {/* Hero Section */}
      <div className="text-center pt-4 pb-4">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-[#ff7eb6] blur-2xl opacity-20 rounded-full" />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-[#fff0f6] shadow-xl relative z-10">
            <ShieldCheck className="text-[#ff7eb6]" size={48} strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3f2b4d] tracking-tight mb-4">
          Trust Center
        </h1>
        <p className="text-[#7d6b86] text-lg max-w-xl mx-auto leading-relaxed">
          Transparency, security, and your privacy. Our commitment to protecting your most sensitive health data.
        </p>
      </div>

      {/* Security Promise Cards (3-column layout preserved) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: End-to-End Encrypted */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#fff0f6] text-[#ff7eb6] rounded-2xl flex items-center justify-center mb-6">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">End-to-End Encrypted</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            Your personal logs and cycle data are encrypted with AES-256. Not even our team can read your sensitive health entries.
          </p>
        </div>

        {/* Card 2: Never Sold */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#f0f9ff] text-[#0369a1] rounded-2xl flex items-center justify-center mb-6">
            <EyeOff size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">Never Sold</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            We will never sell your health data to third parties, advertisers, or data brokers. Your privacy is our business model.
          </p>
        </div>

        {/* Card 3: Anonymous Mode */}
        <div className="bg-white rounded-[2rem] p-8 border border-[#f0e8ee] shadow-sm hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#f7f1ff] text-[#a78bfa] rounded-2xl flex items-center justify-center mb-6">
            <UserX size={24} />
          </div>
          <h3 className="text-xl font-bold text-[#3f2b4d] mb-3">Anonymous Mode</h3>
          <p className="text-[#7d6b86] text-sm leading-relaxed">
            Post in the Community Board without revealing your identity. Enable Anonymous Mode in your Account Settings anytime.
          </p>
        </div>

      </div>

      {/* Terms of Service Section */}
      <div className="bg-white rounded-[2rem] border border-[#f0e8ee] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#f0e8ee] bg-[#faf6f8]/50">
          <h2 className="text-2xl font-bold text-[#3f2b4d] flex items-center gap-2">
            <FileText className="text-[#b06a94]" size={24} />
            Terms of Service
          </h2>
          <p className="text-[#7d6b86] mt-2">Last updated: April 1, 2026</p>
        </div>

        <div className="p-8 space-y-6 text-[#7d6b86] leading-relaxed">
          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">1. Acceptance of Terms</h3>
            <p className="text-sm">
              By accessing or using our period tracking application, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use the service.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">2. Health Data Disclaimer</h3>
            <p className="text-sm">
              Our app provides cycle tracking and predictions for informational purposes only. We do not provide medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">3. User Responsibilities</h3>
            <p className="text-sm">
              You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">4. Acceptable Use</h3>
            <p className="text-sm">
              You agree not to use the service for any unlawful purpose or in any way that could damage, disable, overburden, or impair our servers or networks. Harassment, hate speech, or inappropriate content in the Community Board is strictly prohibited.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">5. Termination</h3>
            <p className="text-sm">
              We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </div>
        </div>
      </div>

      {/* Data Security Policy Section */}
      <div className="bg-white rounded-[2rem] border border-[#f0e8ee] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#f0e8ee] bg-[#faf6f8]/50">
          <h2 className="text-2xl font-bold text-[#3f2b4d] flex items-center gap-2">
            <Server className="text-[#b06a94]" size={24} />
            Data Security Policy
          </h2>
          <p className="text-[#7d6b86] mt-2">How we protect your information</p>
        </div>

        <div className="p-8 space-y-6 text-[#7d6b86] leading-relaxed">
          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Encryption Standards</h3>
            <p className="text-sm">
              All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3. Your health data is stored in isolated databases with strict access controls.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Data Isolation</h3>
            <p className="text-sm">
              Your personal health data is logically separated from other users&apos; data. Each user&apos;s information is stored in a way that prevents cross-contamination or unauthorized access between accounts.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Access Controls</h3>
            <p className="text-sm">
              Only authorized personnel with a legitimate business need can access user data, and all access is logged and monitored. We regularly audit access logs to ensure compliance.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Your Data is Your Business</h3>
            <p className="text-sm">
              You have the right to export, modify, or delete your data at any time through your Account Settings. Upon account deletion, all personal data is permanently removed from our systems within 30 days.
            </p>
          </div>
        </div>
      </div>

      {/* HIPAA/GDPR Compliance Section */}
      <div className="bg-white rounded-[2rem] border border-[#f0e8ee] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-[#f0e8ee] bg-[#faf6f8]/50">
          <h2 className="text-2xl font-bold text-[#3f2b4d] flex items-center gap-2">
            <Globe className="text-[#b06a94]" size={24} />
            Global Compliance Standards
          </h2>
          <p className="text-[#7d6b86] mt-2">Following best practices for sensitive health data worldwide</p>
        </div>

        <div className="p-8 space-y-6 text-[#7d6b86] leading-relaxed">
          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">HIPAA Alignment</h3>
            <p className="text-sm">
              While we are not a covered entity under HIPAA, we voluntarily follow many HIPAA guidelines for protecting health information. This includes administrative safeguards like employee training, physical safeguards for our infrastructure, and technical safeguards like encryption and access controls.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">GDPR Compliance</h3>
            <p className="text-sm">
              For our users in the European Union, we comply with the General Data Protection Regulation (GDPR). You have the right to access, rectify, erase, restrict processing, and port your data. Contact us to exercise these rights.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Data Minimization</h3>
            <p className="text-sm">
              We collect only the data necessary to provide our services. We do not ask for personally identifiable information beyond what is required for account creation, and we anonymize data used for AI training.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#3f2b4d] mb-2">Breach Notification</h3>
            <p className="text-sm">
              In the unlikely event of a data breach, we will notify affected users within 72 hours as required by GDPR and other applicable regulations. We maintain incident response procedures to handle security events promptly.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-[#fff0f6] to-[#f7f1ff] rounded-[2rem] p-8 border border-[#f0e8ee]">
        <h2 className="text-xl font-bold text-[#3f2b4d] mb-4">Questions About Your Privacy?</h2>
        <p className="text-[#7d6b86] text-sm mb-4">
          If you have any questions about this Privacy Policy, our data practices, or your rights, please contact our privacy team.
        </p>
        <p className="text-sm text-[#3f2b4d] font-medium">
          Email: privacy@periodtracker.app
        </p>
      </div>

    </div>
  )
}