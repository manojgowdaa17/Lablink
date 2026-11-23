import React from 'react'
import { FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-navy grid grid-cols-1 lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-navy-800 border-r border-navy-700">
        {/* Gradient orbs */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)' }}
        />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-teal/20 border border-teal/40 flex items-center justify-center">
            <FlaskConical size={22} className="text-teal-300" />
          </div>
          <span className="text-2xl font-bold text-cloud">
            Lab<span className="text-teal-300">Link</span>
          </span>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-cloud mb-4 leading-tight">
            Your campus labs,<br />
            <span className="gradient-text">connected.</span>
          </h2>
          <p className="text-cloud/50 text-lg leading-relaxed mb-8">
            AI-powered equipment discovery, smart booking, and fair resource allocation — all in one platform.
          </p>
          <div className="flex flex-col gap-3">
            {[
              '120+ Specialized Instruments',
              'AI-Matched Equipment',
              'Real-Time Availability',
              'Faculty-Approved Access',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />
                <span className="text-cloud/60 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-cloud/30 text-xs relative z-10">© 2024 LabLink. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center">
              <FlaskConical size={18} className="text-teal-300" />
            </div>
            <span className="text-xl font-bold text-cloud">
              Lab<span className="text-teal-300">Link</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold text-cloud mb-1">{title}</h1>
          <p className="text-cloud/50 text-sm mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  )
}
