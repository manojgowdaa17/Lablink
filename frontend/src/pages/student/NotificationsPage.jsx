import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, Search, FileText, Calendar, Bell,
  CheckCheck, Loader2, Info, CheckCircle, XCircle, MessageSquare
} from 'lucide-react'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/dashboard',              icon: LayoutDashboard },
  { label: 'Find Equipment', href: '/dashboard/equipment',    icon: Search },
  { label: 'My Requests',    href: '/dashboard/requests',     icon: FileText },
  { label: 'My Bookings',    href: '/dashboard/bookings',     icon: Calendar },
  { label: 'Notifications',  href: '/dashboard/notifications',icon: Bell },
]

const TYPE_ICONS = {
  approval:   { icon: CheckCircle, color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  rejection:  { icon: XCircle,     color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  suggestion: { icon: MessageSquare, color: 'text-amber bg-amber/10 border-amber/20' },
  default:    { icon: Info,         color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread]               = useState(0)
  const [loading, setLoading]             = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/notifications/')
      setNotifications(res.data.notifications || [])
      setUnread(res.data.unread || 0)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    await api.patch(`/api/notifications/${id}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(u => Math.max(0, u - 1))
  }

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cloud">Notifications</h2>
          <p className="text-sm text-cloud/50 mt-0.5">
            {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal/10 border border-teal/20 text-teal-300 text-sm font-medium hover:bg-teal/20 transition-all">
            <CheckCheck size={16} />
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-300" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <Bell size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm">Faculty approvals and updates will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map(n => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.default
            const Icon = meta.icon
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer
                  ${n.read
                    ? 'bg-navy-800 border-navy-700 opacity-70'
                    : 'bg-navy-800 border-navy-600 hover:border-teal/30'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-semibold text-sm ${n.read ? 'text-cloud/60' : 'text-cloud'}`}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-cloud/50 mt-1 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-cloud/30 mt-2">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
