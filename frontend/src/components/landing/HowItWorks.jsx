import React from 'react'
import { Search, FileText, Sparkles, CheckCircle, QrCode } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Search,
    title: 'Discover',
    description:
      'Browse the full catalogue of equipment across all university departments and labs. Filter by category, availability, and department.',
  },
  {
    number: '02',
    icon: FileText,
    title: 'Request',
    description:
      'Submit a booking request with your project description, required dates, and intended use. Takes less than two minutes.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'AI Match',
    description:
      "Gemini AI analyzes your project description and intelligently recommends the best-fit equipment, flagging conflicts and alternatives.",
  },
  {
    number: '04',
    icon: CheckCircle,
    title: 'Faculty Approval',
    description:
      'Your faculty supervisor reviews the AI-generated recommendation and approves the booking — with a tracked SLA deadline.',
  },
  {
    number: '05',
    icon: QrCode,
    title: 'Access',
    description:
      'Receive a QR code to your registered email. Scan at the lab door to check in, start the session, and begin your research.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-navy-800/40">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/30 text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={12} />
            Simple 5-Step Process
          </div>
          <h2 className="section-title">How LabLink Works</h2>
          <p className="section-subtitle mx-auto">
            From discovery to lab access in five straightforward steps — powered by AI and streamlined approvals.
          </p>
        </div>

        {/* Steps — desktop horizontal flow */}
        <div className="hidden lg:flex items-start gap-0 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isLast = idx === STEPS.length - 1
            return (
              <div key={step.number} className="flex-1 flex flex-col items-center relative group">
                {/* Connecting line */}
                {!isLast && (
                  <div className="absolute top-[28px] left-[calc(50%+32px)] right-0 h-px bg-gradient-to-r from-teal/40 to-teal/10 z-0" />
                )}

                {/* Circle icon */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center shadow-lg shadow-teal/20 group-hover:shadow-teal/40 transition-shadow mb-4">
                  <Icon size={22} className="text-white" />
                  {/* Number badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber text-navy text-[10px] font-black rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="text-center px-3">
                  <h3 className="font-bold text-cloud text-sm mb-2 group-hover:text-teal-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-cloud/50 leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Steps — mobile vertical list */}
        <div className="lg:hidden flex flex-col gap-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon
            const isLast = idx === STEPS.length - 1
            return (
              <div key={step.number} className="relative flex gap-5">
                {/* Vertical line */}
                {!isLast && (
                  <div className="absolute left-[26px] top-[56px] bottom-0 w-px bg-gradient-to-b from-teal/40 to-transparent" />
                )}

                {/* Circle icon */}
                <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center shadow-lg shadow-teal/20 relative">
                  <Icon size={22} className="text-white" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber text-navy text-[10px] font-black rounded-full flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="pt-2">
                  <h3 className="font-bold text-cloud text-sm mb-1">{step.title}</h3>
                  <p className="text-sm text-cloud/50 leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
