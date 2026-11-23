import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { LayoutDashboard, Search, FileText, Calendar, Bell, Loader2, CalendarX } from 'lucide-react'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Find Equipment', href: '/dashboard/equipment', icon: Search },
  { label: 'My Requests', href: '/dashboard/requests', icon: FileText },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

const STATUS_COLORS = {
  confirmed:        'text-green-400 bg-green-400/10 border-green-400/20',
  pending_approval: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  cancelled:        'text-red-400 bg-red-400/10 border-red-400/20',
  completed:        'text-teal-300 bg-teal/10 border-teal/20',
  no_show:          'text-cloud/40 bg-cloud/5 border-cloud/10',
}

function formatDT(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      const res = await api.get('/api/bookings/', { params })
      setBookings(res.data.items || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filter])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return
    try {
      await api.patch(`/api/bookings/${id}/cancel`, { reason: 'Cancelled by student' })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel booking.')
    }
  }

  const FILTERS = ['all', 'confirmed', 'pending_approval', 'completed', 'cancelled']

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="My Bookings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cloud">My Bookings</h2>
          <p className="text-sm text-cloud/50 mt-0.5">View and manage your lab equipment bookings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
              ${filter === f ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}>
            {f === 'pending_approval' ? 'Pending' : f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <CalendarX size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No bookings found</p>
          <p className="text-sm">Your confirmed lab sessions will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 hover:border-navy-600 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-cloud">{b.equipment_name || 'Unknown Equipment'}</h3>
                    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'text-cloud/40'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-cloud/40">
                    <span>Start: {formatDT(b.start_time)}</span>
                    <span>End: {formatDT(b.end_time)}</span>
                    {b.approved_at && <span>Approved: {formatDT(b.approved_at)}</span>}
                  </div>
                  {b.cancellation_reason && (
                    <p className="text-xs text-red-400/70 mt-2">Reason: {b.cancellation_reason}</p>
                  )}
                </div>
                {['confirmed', 'pending_approval'].includes(b.status) && (
                  <button onClick={() => handleCancel(b.id)}
                    className="text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all flex-shrink-0">
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
