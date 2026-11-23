import React from 'react'
import { CheckCircle2, FlaskConical } from 'lucide-react'

const HIGHLIGHTS = [
  'Open to all enrolled students and faculty — no gatekeeping.',
  'Full audit trail and compliance logging for department heads.',
  'AI-generated summaries surface booking patterns and resource gaps.',
]

const TERMINAL_LINES = [
  { prompt: '>', text: 'lablink.match --project "ML training pipeline"', color: 'text-teal-300' },
  { prompt: ' ', text: 'Analyzing project requirements…', color: 'text-cloud/40' },
  { prompt: ' ', text: '✓ NVIDIA DGX A100 — 97% match', color: 'text-green-400' },
  { prompt: ' ', text: '✓ CUDA Dev Environment — 94% match', color: 'text-green-400' },
  { prompt: ' ', text: '~ Raspberry Pi Cluster — 71% match', color: 'text-yellow-400' },
  { prompt: '>', text: 'lablink.book --id dgx-a100 --date 2026-11-25', color: 'text-teal-300' },
  { prompt: ' ', text: 'Submitting booking request…', color: 'text-cloud/40' },
  { prompt: ' ', text: '✓ Request #BK-00412 created', color: 'text-green-400' },
  { prompt: ' ', text: '✓ Faculty notified — SLA: 24h', color: 'text-green-400' },
  { prompt: '>', text: '█', color: 'text-teal-400' },
]

function TerminalPanel() {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute -inset-6 bg-teal/5 rounded-3xl blur-2xl pointer-events-none" />

      {/* Terminal window */}
      <div className="relative bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-navy-700/60 border-b border-navy-600">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
          <span className="ml-3 text-xs text-cloud/30 font-mono">lablink — bash</span>
        </div>

        {/* Terminal body */}
        <div className="p-5 font-mono text-xs space-y-1.5 min-h-[280px]">
          {TERMINAL_LINES.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-teal/50 select-none w-3 shrink-0">{line.prompt}</span>
              <span
                className={`${line.color} ${line.text === '█' ? 'animate-pulse' : ''}`}
                style={{ animationDuration: '1s' }}
              >
                {line.text}
              </span>
            </div>
          ))}
        </div>

        {/* Stats strip at bottom */}
        <div className="border-t border-navy-700 px-5 py-3 flex items-center justify-between bg-navy-700/30">
          <div className="flex items-center gap-2">
            <FlaskConical size={14} className="text-teal-400" />
            <span className="text-xs text-cloud/40 font-mono">lablink v1.0.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-cloud/30 font-mono">
            <span className="text-green-400">● connected</span>
            <span>MongoDB Atlas</span>
            <span>Gemini 1.5 Pro</span>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -bottom-5 right-6 bg-amber/10 border border-amber/30 rounded-xl px-4 py-2 backdrop-blur-sm">
        <span className="text-xs font-semibold text-amber-300">FairShare™ Allocation Active</span>
      </div>
    </div>
  )
}

export default function AboutSection() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 bg-navy-800/40">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: terminal panel */}
          <TerminalPanel />

          {/* Right: text content */}
          <div>
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/30 text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <CheckCircle2 size={12} />
              About the Platform
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-cloud leading-tight mb-6">
              Built for the
              <br />
              <span className="gradient-text">Modern Campus Lab</span>
            </h2>

            <div className="space-y-4 text-cloud/60 leading-relaxed mb-8">
              <p>
                LabLink was born from a simple frustration: university labs are full of specialized,
                expensive equipment that sits idle while students across the hall can't access it. Siloed
                booking systems, opaque approval chains, and lack of visibility create friction at every step.
              </p>
              <p>
                We built LabLink to dissolve those silos. By combining a unified equipment catalogue with
                Google's Gemini AI for intelligent matching and a transparent FairShare allocation engine,
                every student — regardless of department or seniority — gets fair access to the tools they
                need to do great research.
              </p>
              <p>
                Faculty retain full oversight and approval authority. Department heads gain real-time
                analytics. Students get answers in hours, not days. That's the LabLink promise.
              </p>
            </div>

            {/* Highlights */}
            <ul className="space-y-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-teal-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-cloud/70">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
