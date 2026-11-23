import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, Search, FileText, Calendar, Bell,
  CalendarCheck, ClipboardList, Cpu, Rocket, ArrowRight, Plus
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Find Equipment', href: '/dashboard/equipment', icon: Search },
  { label: 'My Requests', href: '/dashboard/requests', icon: FileText },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

const DEFAULT_STATS = { active_bookings: 0, pending_requests: 0, total_equipment_used: 0, upcoming_sessions: 0 }

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-cloud">{value}</p>
        <p className="text-sm text-cloud/50">{label}</p>
      </div>
    </div>
  )
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats]       = useState(DEFAULT_STATS)
  const [activity, setActivity] = useState([])

  useEffect(() => {
    api.get('/api/student/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/api/student/recent-activity').then(r => setActivity(r.data.activity || [])).catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Dashboard">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal/10 to-transparent border border-teal/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-cloud">
              Welcome back, <span className="text-teal-300">{user?.name?.split(' ')[0] || 'Student'}</span>!
            </h2>
            <p className="text-cloud/50 text-sm mt-1">{today}</p>
          </div>
          <Link to="/dashboard/equipment" className="btn-primary flex items-center gap-2 text-sm">
            <Search size={16} /> Find Equipment
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={CalendarCheck} label="Active Bookings"    value={stats.active_bookings}      color="bg-teal/10 text-teal-300" />
        <StatCard icon={ClipboardList} label="Pending Requests"   value={stats.pending_requests}     color="bg-amber/10 text-amber" />
        <StatCard icon={Cpu}           label="Equipment Used"     value={stats.total_equipment_used} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={Rocket}        label="Upcoming Sessions"  value={stats.upcoming_sessions}    color="bg-blue-500/10 text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cloud">Recent Activity</h3>
            <Link to="/dashboard/bookings" className="text-xs text-teal-300 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-cloud/30">
              <Calendar size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No activity yet</p>
              <p className="text-xs mt-1">Your bookings will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activity.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-navy-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-cloud">{a.equipment_name}</p>
                    <p className="text-xs text-cloud/40">{a.start_time ? new Date(a.start_time).toLocaleDateString() : '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize
                    ${a.status === 'confirmed' ? 'text-green-400 border-green-400/30 bg-green-400/10'
                    : a.status === 'completed' ? 'text-teal-300 border-teal/30 bg-teal/10'
                    : 'text-cloud/40 border-cloud/10'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <h3 className="font-semibold text-cloud mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Link to="/dashboard/equipment" className="flex items-center gap-3 p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-teal/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                <Search size={16} className="text-teal-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-cloud">Find Equipment</p>
                <p className="text-xs text-cloud/40">Browse all labs</p>
              </div>
            </Link>
            <Link to="/dashboard/requests" className="flex items-center gap-3 p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-amber/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
                <Plus size={16} className="text-amber" />
              </div>
              <div>
                <p className="text-sm font-medium text-cloud">New Request</p>
                <p className="text-xs text-cloud/40">Submit a project request</p>
              </div>
            </Link>
            <Link to="/dashboard/bookings" className="flex items-center gap-3 p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-blue-400/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Calendar size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-cloud">View Calendar</p>
                <p className="text-xs text-cloud/40">My bookings schedule</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
