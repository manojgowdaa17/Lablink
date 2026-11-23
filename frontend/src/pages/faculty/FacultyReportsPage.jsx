import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2,
  Loader2, TrendingUp, Users, Package, CheckCircle
} from 'lucide-react'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard',         href: '/faculty/dashboard',          icon: LayoutDashboard },
  { label: 'Pending Approvals', href: '/faculty/dashboard/approvals', icon: ClipboardList },
  { label: 'Active Bookings',   href: '/faculty/dashboard/bookings',  icon: Calendar },
  { label: 'Equipment',         href: '/faculty/dashboard/equipment', icon: Wrench },
  { label: 'Reports',           href: '/faculty/dashboard/reports',   icon: BarChart2 },
]

export default function FacultyReportsPage() {
  const [stats, setStats]       = useState(null)
  const [depts, setDepts]       = useState([])
  const [bkStatus, setBkStatus] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [sRes, dRes, bRes] = await Promise.allSettled([
          api.get('/api/faculty/stats'),
          api.get('/api/admin/panel/analytics/departments'),
          api.get('/api/admin/panel/analytics/bookings-by-status'),
        ])
        if (sRes.status === 'fulfilled') setStats(sRes.value.data)
        if (dRes.status === 'fulfilled') setDepts(dRes.value.data.departments || [])
        if (bRes.status === 'fulfilled') setBkStatus(bRes.value.data.data || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return (
    <DashboardLayout navItems={NAV_ITEMS} title="Reports">
      <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
    </DashboardLayout>
  )

  const maxDept = Math.max(1, ...depts.map(d => d.total))
  const totalBk = bkStatus.reduce((s, x) => s + x.count, 0) || 1
  const BK_COLORS = {
    confirmed: '#10b981', pending_approval: '#f59e0b',
    cancelled: '#ef4444', completed: '#5eead4', no_show: '#94a3b8'
  }

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Reports">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cloud">Lab Usage Reports</h2>
        <p className="text-sm text-cloud/50 mt-0.5">Overview of equipment usage and booking statistics</p>
      </div>

      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: ClipboardList, label: 'Pending Approvals',   value: stats.pending_approvals,      color: 'bg-amber/10 text-amber' },
            { icon: CheckCircle,   label: 'Approved This Week',  value: stats.approved_this_week,     color: 'bg-green-500/10 text-green-400' },
            { icon: Calendar,      label: 'Active Bookings',     value: stats.active_bookings,        color: 'bg-teal/10 text-teal-300' },
            { icon: Package,       label: 'Pending Bookings',    value: stats.total_pending_bookings, color: 'bg-blue-500/10 text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <p className="text-xl font-bold text-cloud">{s.value}</p>
                <p className="text-xs text-cloud/50">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment by Department */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <h3 className="font-semibold text-cloud mb-5 flex items-center gap-2">
            <Package size={16} className="text-teal-300" /> Equipment by Department
          </h3>
          {depts.length === 0 ? (
            <p className="text-cloud/30 text-sm text-center py-6">No data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {depts.map(d => (
                <div key={d.department}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-cloud/80">{d.department}</span>
                    <span className="text-xs text-cloud/40">{d.available}/{d.total} available</span>
                  </div>
                  <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(d.total / maxDept) * 100}%`, background: 'linear-gradient(90deg,#0d9488,#38bdf8)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bookings by Status */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <h3 className="font-semibold text-cloud mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-300" /> Bookings by Status
          </h3>
          {bkStatus.length === 0 ? (
            <p className="text-cloud/30 text-sm text-center py-6">No bookings yet</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {bkStatus.map(b => (
                <div key={b.status} className="bg-navy-700 border border-navy-600 rounded-xl p-4">
                  <p className="text-2xl font-bold text-cloud">{b.count}</p>
                  <p className="text-xs text-cloud/50 capitalize mt-0.5">{b.status?.replace('_', ' ')}</p>
                  <div className="mt-3 h-1.5 bg-navy-600 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(b.count / totalBk) * 100}%`, backgroundColor: BK_COLORS[b.status] || '#64748b' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
