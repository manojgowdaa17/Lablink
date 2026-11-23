import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2,
  CheckCircle, Clock, CalendarCheck, Package, ArrowRight, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard',         href: '/faculty/dashboard',          icon: LayoutDashboard },
  { label: 'Pending Approvals', href: '/faculty/dashboard/approvals', icon: ClipboardList },
  { label: 'Active Bookings',   href: '/faculty/dashboard/bookings',  icon: Calendar },
  { label: 'Equipment',         href: '/faculty/dashboard/equipment', icon: Wrench },
  { label: 'Reports',           href: '/faculty/dashboard/reports',   icon: BarChart2 },
]

const DEFAULT_STATS = { pending_approvals: 0, approved_this_week: 0, active_bookings: 0, total_pending_bookings: 0 }

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

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [stats, setStats]       = useState(DEFAULT_STATS)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    api.get('/api/faculty/stats').then(r => setStats(r.data)).catch(() => {})
    api.get('/api/faculty/requests', { params: { status: 'submitted', per_page: 3 } })
      .then(r => setRequests(r.data.items || [])).catch(() => {})
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Faculty Dashboard">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-teal/10 to-transparent border border-teal/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-cloud">
              Welcome, <span className="text-teal-300">{user?.name?.split(' ')[0] || 'Faculty'}</span>
            </h2>
            <p className="text-cloud/50 text-sm mt-1">{today}</p>
          </div>
          {stats.pending_approvals > 0 && (
            <Link to="/faculty/dashboard/approvals" className="btn-amber flex items-center gap-2 text-sm">
              <ClipboardList size={16} />
              {stats.pending_approvals} Pending Review
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock}         label="Pending Approvals"   value={stats.pending_approvals}      color="bg-amber/10 text-amber" />
        <StatCard icon={CheckCircle}   label="Approved This Week"  value={stats.approved_this_week}     color="bg-green-500/10 text-green-400" />
        <StatCard icon={CalendarCheck} label="Active Bookings"     value={stats.active_bookings}        color="bg-teal/10 text-teal-300" />
        <StatCard icon={Package}       label="Pending Bookings"    value={stats.total_pending_bookings} color="bg-blue-500/10 text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending requests preview */}
        <div className="lg:col-span-2 bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cloud">Pending Requests</h3>
            <Link to="/faculty/dashboard/approvals" className="text-xs text-teal-300 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-cloud/30">
              <ClipboardList size={36} className="mb-3 opacity-30" />
              <p className="text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {requests.map(req => (
                <Link key={req.id} to="/faculty/dashboard/approvals"
                  className="flex items-center justify-between p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-teal/30 transition-all group">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-cloud truncate">{req.project_title}</p>
                    <p className="text-xs text-cloud/40">{req.student_name} · {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}</p>
                  </div>
                  <ChevronRight size={16} className="text-cloud/30 group-hover:text-teal-300 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <h3 className="font-semibold text-cloud mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Link to="/faculty/dashboard/approvals"
              className="flex items-center gap-3 p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-teal/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-amber/10 flex items-center justify-center group-hover:bg-amber/20 transition-colors">
                <ClipboardList size={16} className="text-amber" />
              </div>
              <div>
                <p className="text-sm font-medium text-cloud">Review Requests</p>
                <p className="text-xs text-cloud/40">Approve or reject</p>
              </div>
            </Link>
            <Link to="/faculty/dashboard/bookings"
              className="flex items-center gap-3 p-3 rounded-xl bg-navy-700 hover:bg-navy-600 border border-navy-600 hover:border-teal/30 transition-all group">
              <div className="w-9 h-9 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                <Calendar size={16} className="text-teal-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-cloud">View Schedule</p>
                <p className="text-xs text-cloud/40">Active bookings</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
