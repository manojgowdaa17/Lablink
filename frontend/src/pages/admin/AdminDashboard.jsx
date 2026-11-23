import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical, LayoutDashboard, Users, Package, Calendar,
  Monitor, ShieldAlert, BarChart2, LogOut, Menu, X, Circle,
  RefreshCw, Loader2, AlertTriangle, CalendarCheck
} from 'lucide-react'
import api from '../../utils/api'

const SIDEBAR_SECTIONS = [
  { id: 'overview',   label: 'Overview',   icon: LayoutDashboard },
  { id: 'users',      label: 'Users',      icon: Users },
  { id: 'equipment',  label: 'Equipment',  icon: Package },
  { id: 'bookings',   label: 'Bookings',   icon: Calendar },
  { id: 'sessions',   label: 'Sessions',   icon: Monitor },
  { id: 'security',   label: 'Security',   icon: ShieldAlert },
  { id: 'analytics',  label: 'Analytics',  icon: BarChart2 },
]

const DEFAULT_STATS = {
  total_users: 0, total_equipment: 0, active_sessions: 0,
  pending_approvals: 0, todays_bookings: 0, security_events: 0,
}

function StatCard({ icon: Icon, label, value, color, border }) {
  return (
    <div className={`bg-navy-800 border ${border || 'border-navy-700'} rounded-2xl p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xl font-bold text-cloud">{value}</p>
        <p className="text-xs text-cloud/50">{label}</p>
      </div>
    </div>
  )
}

function HealthDot({ status }) {
  const color = status === 'connected' || status === 'ok'
    ? 'bg-green-400'
    : status === 'unknown' ? 'bg-yellow-400' : 'bg-red-400'
  return <span className={`inline-block w-2 h-2 rounded-full ${color} animate-pulse`} />
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [sidebarOpen, setSidebarOpen]     = useState(false)
  const [stats, setStats]     = useState(DEFAULT_STATS)
  const [health, setHealth]   = useState({ status: 'unknown', database: 'unknown' })
  const [auditLogs, setAuditLogs] = useState([])
  const [sessions, setSessions]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [adminName, setAdminName] = useState('Admin')

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, healthRes, logsRes, sessionsRes, meRes] = await Promise.allSettled([
        api.get('/api/admin/panel/stats'),
        api.get('/api/health'),
        api.get('/api/admin/panel/audit-logs', { params: { per_page: 5 } }),
        api.get('/api/admin/panel/sessions', { params: { per_page: 5, status: 'active' } }),
        api.get('/api/admin/me'),
      ])
      if (statsRes.status === 'fulfilled')    setStats(statsRes.value.data)
      if (healthRes.status === 'fulfilled')   setHealth(healthRes.value.data)
      if (logsRes.status === 'fulfilled')     setAuditLogs(logsRes.value.data.items || [])
      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value.data.items || [])
      if (meRes.status === 'fulfilled')       setAdminName(meRes.value.data.name || 'Admin')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleLogout = async () => {
    try { await api.post('/api/admin/logout') } catch (_) {}
    navigate('/admin/login')
  }

  const renderContent = () => {
    if (activeSection !== 'overview') {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/30">
          <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center mb-4">
            {React.createElement(SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.icon || LayoutDashboard, { size: 28, className: 'text-amber/60' })}
          </div>
          <p className="text-lg font-medium text-cloud/40 capitalize">{activeSection} Management</p>
          <p className="text-sm mt-1">This section will be expanded in Phase 5 & 6.</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6">
        {/* System health strip */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-cloud">System Health</h3>
            <button onClick={loadData} className="p-1.5 rounded-lg text-cloud/40 hover:text-cloud hover:bg-navy-700 transition-colors">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { label: 'API Server', status: health.status },
              { label: 'Database', status: health.database },
              { label: 'AI Service', status: 'unknown' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 bg-navy-700 border border-navy-600 rounded-xl px-3 py-2">
                <HealthDot status={item.status} />
                <span className="text-xs font-medium text-cloud">{item.label}</span>
                <span className="text-xs text-cloud/40 capitalize">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Users}        label="Total Users"        value={stats.total_users}       color="bg-teal/10 text-teal-300"         border="border-navy-700" />
          <StatCard icon={Package}      label="Total Equipment"    value={stats.total_equipment}   color="bg-blue-500/10 text-blue-400"     border="border-navy-700" />
          <StatCard icon={Monitor}      label="Active Sessions"    value={stats.active_sessions}   color="bg-purple-500/10 text-purple-400" border="border-navy-700" />
          <StatCard icon={Calendar}     label="Pending Approvals"  value={stats.pending_approvals} color="bg-amber/10 text-amber"           border="border-amber/20" />
          <StatCard icon={CalendarCheck} label="Today's Bookings"  value={stats.todays_bookings}   color="bg-green-500/10 text-green-400"   border="border-navy-700" />
          <StatCard icon={ShieldAlert}  label="Security Events"    value={stats.security_events}   color="bg-red-500/10 text-red-400"       border={stats.security_events > 0 ? 'border-red-500/30' : 'border-navy-700'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Audit Logs */}
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            <h3 className="font-semibold text-cloud mb-4">Recent Audit Logs</h3>
            {auditLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-cloud/30">
                <ShieldAlert size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No audit events yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                    <div>
                      <p className="text-sm text-cloud font-medium capitalize">{log.action?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-cloud/40">{log.actor_role} · {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</p>
                    </div>
                    <span className="text-xs text-cloud/40 bg-navy-700 border border-navy-600 px-2 py-0.5 rounded-lg capitalize">
                      {log.target_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Sessions */}
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
            <h3 className="font-semibold text-cloud mb-4">Active Sessions</h3>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-cloud/30">
                <Monitor size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No active sessions</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                    <div>
                      <p className="text-sm text-cloud font-medium capitalize">{s.role}</p>
                      <p className="text-xs text-cloud/40 truncate max-w-[180px]">{s.ip_address || 'Unknown IP'}</p>
                    </div>
                    <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-lg">
                      active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <h3 className="font-semibold text-cloud mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Manage Users',   icon: Users,       section: 'users' },
              { label: 'Equipment',      icon: Package,     section: 'equipment' },
              { label: 'View Sessions',  icon: Monitor,     section: 'sessions' },
              { label: 'Audit Logs',     icon: ShieldAlert, section: 'security' },
            ].map(a => (
              <button key={a.section} onClick={() => setActiveSection(a.section)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-navy-700 border border-navy-600 hover:border-amber/30 hover:bg-amber/5 transition-all group">
                <a.icon size={20} className="text-amber/60 group-hover:text-amber transition-colors" />
                <span className="text-xs font-medium text-cloud/60 group-hover:text-cloud transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-30 w-64 bg-navy-800 border-r border-navy-700 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-navy-700">
          <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/40 flex items-center justify-center">
            <FlaskConical size={18} className="text-amber" />
          </div>
          <div>
            <span className="text-lg font-bold text-cloud">Lab<span className="text-amber">Link</span></span>
            <p className="text-xs text-cloud/40">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-cloud/50 hover:text-cloud" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {SIDEBAR_SECTIONS.map(s => {
            const Icon = s.icon
            const isActive = activeSection === s.id
            return (
              <button key={s.id} onClick={() => { setActiveSection(s.id); setSidebarOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left
                  ${isActive ? 'bg-amber/10 text-amber border border-amber/20' : 'text-cloud/60 hover:text-cloud hover:bg-navy-700'}`}>
                <Icon size={18} className={isActive ? 'text-amber' : 'text-cloud/40'} />
                {s.label}
              </button>
            )
          })}
        </nav>

        {/* Admin info + logout */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-amber/20 border border-amber/30 flex items-center justify-center">
              <span className="text-xs font-bold text-amber">{adminName[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cloud truncate">{adminName}</p>
              <p className="text-xs text-cloud/40">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-cloud/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur-md border-b border-navy-700 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg text-cloud/60 hover:text-cloud hover:bg-navy-800 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-cloud">
              LabLink <span className="text-amber">Admin</span>
              <span className="text-cloud/40 font-normal text-sm ml-2 capitalize">/ {activeSection}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {loading && <Loader2 size={16} className="animate-spin text-cloud/40" />}
            <button onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-cloud/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
