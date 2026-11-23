import React, { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, Users, Package, Building2, CalendarCheck } from 'lucide-react'
import axios from 'axios'

const PLACEHOLDER_STATS = {
  total_equipment: 120,
  total_departments: 8,
  total_students: 1500,
  total_bookings: 4300,
}

function StatItem({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4 border-r border-navy-700 last:border-r-0">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-teal-400" />
        <span className="text-2xl font-bold text-cloud">{value.toLocaleString()}+</span>
      </div>
      <span className="text-xs text-cloud/50 uppercase tracking-widest">{label}</span>
    </div>
  )
}

function EquipmentCardMockup() {
  return (
    <div className="hidden lg:block relative w-full max-w-sm ml-auto">
      {/* Glow effect behind card */}
      <div className="absolute -inset-4 bg-teal/10 rounded-3xl blur-2xl" />

      {/* Main card */}
      <div className="relative bg-navy-800/90 border border-navy-700 rounded-2xl p-5 backdrop-blur-sm shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-teal-300 bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full">
            Computing
          </span>
          <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Available
          </span>
        </div>
        <h3 className="font-bold text-cloud text-sm mb-1">NVIDIA DGX A100 Workstation</h3>
        <p className="text-xs text-cloud/50 mb-4">CS & AI Lab — Engineering Block B</p>

        {/* Spec badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['8× A100 GPUs', '320GB HBM2e', 'CUDA 12.4'].map((spec) => (
            <span key={spec} className="text-xs text-cloud/60 bg-navy-700 border border-navy-600 px-2 py-1 rounded-lg">
              {spec}
            </span>
          ))}
        </div>

        {/* Mini booking form mockup */}
        <div className="bg-navy-700/60 border border-navy-600 rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-cloud/70 mb-2">Quick Booking</p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-xs text-cloud/40">
                Start date
              </div>
              <div className="flex-1 bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-xs text-cloud/40">
                End date
              </div>
            </div>
            <div className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-xs text-cloud/40">
              Project description…
            </div>
          </div>
        </div>

        <button className="w-full bg-teal hover:bg-teal-600 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
          <Sparkles size={13} />
          Request with AI Match
        </button>
      </div>

      {/* Floating badge — approval status */}
      <div className="absolute -bottom-4 -left-4 bg-amber/10 border border-amber/30 rounded-xl px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <CalendarCheck size={14} className="text-amber-300" />
          <span className="text-xs font-semibold text-amber-300">Approved in &lt;2h avg</span>
        </div>
      </div>

      {/* Floating badge — AI confidence */}
      <div className="absolute -top-4 -right-2 bg-teal/10 border border-teal/30 rounded-xl px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-teal-300" />
          <span className="text-xs font-semibold text-teal-300">AI Match: 97%</span>
        </div>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const [stats, setStats] = useState(PLACEHOLDER_STATS)

  useEffect(() => {
    axios
      .get('/api/public/stats')
      .then((res) => setStats(res.data))
      .catch(() => {/* keep placeholder */})
  }, [])

  const handleScrollTo = (href) => {
    const target = document.querySelector(href)
    if (target) target.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: '#101827' }}
    >
      {/* Animated gradient orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #0D9488 0%, transparent 70%)',
          animation: 'orb1 12s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #F59E0B 0%, transparent 70%)',
          animation: 'orb2 15s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #5eead4 0%, transparent 70%)',
          animation: 'orb3 18s ease-in-out infinite alternate',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <style>{`
        @keyframes orb1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 80px) scale(1.15); }
        }
        @keyframes orb2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-80px, -60px) scale(1.2); }
        }
        @keyframes orb3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-40px, 60px) scale(0.9); }
        }
      `}</style>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: headline + CTAs + stats */}
          <div className="animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/30 text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={12} />
              AI-Powered Resource Matching
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-cloud leading-[1.05] tracking-tight mb-6">
              Every Lab.
              <br />
              Every Resource.
              <br />
              <span className="gradient-text">One Connected</span>
              <br />
              <span className="gradient-text">Campus.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-cloud/60 leading-relaxed max-w-lg mb-8">
              Discover, book and access specialized laboratory equipment with AI-powered
              matching and fair resource allocation — built for the modern university.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mb-12">
              <button
                onClick={() => handleScrollTo('#explore')}
                className="btn-primary text-base flex items-center gap-2"
              >
                Explore Resources
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => handleScrollTo('#how-it-works')}
                className="btn-secondary text-base"
              >
                Get Started
              </button>
            </div>

            {/* Stats bar */}
            <div className="bg-navy-800/70 border border-navy-700 rounded-2xl backdrop-blur-sm overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-navy-700">
                <StatItem icon={Package} value={stats.total_equipment} label="Equipment" />
                <StatItem icon={Building2} value={stats.total_departments} label="Departments" />
                <StatItem icon={Users} value={stats.total_students} label="Students" />
                <StatItem icon={CalendarCheck} value={stats.total_bookings} label="Bookings" />
              </div>
            </div>
          </div>

          {/* Right: decorative equipment card */}
          <EquipmentCardMockup />
        </div>
      </div>
    </section>
  )
}
