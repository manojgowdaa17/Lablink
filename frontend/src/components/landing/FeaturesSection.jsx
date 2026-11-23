import React from 'react'
import {
  Sparkles,
  Scale,
  Radio,
  UserCheck,
  CalendarClock,
  BarChart3,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description:
      "Gemini API reads your project description and intelligently matches it to the most suitable available equipment across all labs — no guesswork.",
    accent: 'teal',
  },
  {
    icon: Scale,
    title: 'FairShare Allocation',
    description:
      'Priority scoring system ensures equitable access across all departments. Bookings are weighted by urgency, deadlines, and historical usage.',
    accent: 'teal',
  },
  {
    icon: Radio,
    title: 'Real-Time Availability',
    description:
      'Live status feeds from all labs keep the catalogue accurate to the minute. No more walking to the lab only to find equipment in use.',
    accent: 'teal',
  },
  {
    icon: UserCheck,
    title: 'Faculty Oversight',
    description:
      'Streamlined approval workflows with built-in SLA deadlines ensure faculty supervisors never miss a pending request.',
    accent: 'amber',
  },
  {
    icon: CalendarClock,
    title: 'Smart Scheduling',
    description:
      'Automatic conflict detection surfaces alternative time slots and equipment before you submit — saving everyone time.',
    accent: 'amber',
  },
  {
    icon: BarChart3,
    title: 'Audit & Analytics',
    description:
      'Full transparency dashboards for department heads: usage trends, peak hours, equipment ROI, and fair-access compliance reports.',
    accent: 'amber',
  },
]

function FeatureCard({ feature }) {
  const Icon = feature.icon
  const isTeal = feature.accent === 'teal'

  return (
    <div className="card group cursor-default">
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
          isTeal
            ? 'bg-teal/10 border border-teal/20 group-hover:bg-teal/20 group-hover:border-teal/40'
            : 'bg-amber/10 border border-amber/20 group-hover:bg-amber/20 group-hover:border-amber/40'
        }`}
      >
        <Icon
          size={22}
          className={isTeal ? 'text-teal-400' : 'text-amber-400'}
        />
      </div>

      <h3
        className={`font-bold text-cloud text-sm mb-2 transition-colors ${
          isTeal ? 'group-hover:text-teal-300' : 'group-hover:text-amber-300'
        }`}
      >
        {feature.title}
      </h3>
      <p className="text-sm text-cloud/50 leading-relaxed">{feature.description}</p>

      {/* Bottom accent line on hover */}
      <div
        className={`mt-4 h-px w-0 group-hover:w-full transition-all duration-500 ${
          isTeal
            ? 'bg-gradient-to-r from-teal/60 to-transparent'
            : 'bg-gradient-to-r from-amber/60 to-transparent'
        }`}
      />
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/30 text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Sparkles size={12} />
            Platform Capabilities
          </div>
          <h2 className="section-title">Everything You Need to Succeed</h2>
          <p className="section-subtitle mx-auto">
            LabLink brings AI, fairness, and real-time data together in one seamless platform built for university research.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  )
}
