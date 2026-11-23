import React, { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2,
  Loader2, CalendarX, CheckCircle, XCircle
} from 'lucide-react'
import api from '../../utils/api'

const NAV_ITEMS = [
  { label: 'Dashboard',         href: '/faculty/dashboard',          icon: LayoutDashboard },
  { label: 'Pending Approvals', href: '/faculty/dashboard/approvals', icon: ClipboardList },
  { label: 'Active Bookings',   href: '/faculty/dashboard/bookings',  icon: Calendar },
  { label: 'Equipment',         href: '/faculty/dashboard/equipment', icon: Wrench },
  { label: 'Reports',           href: '/faculty/dashboard/reports',   icon: BarChart2 },
]

const STATUS_COLORS = {
  confirmed:        'text-green-400 bg-green-400/10 border-green-400/20',
  pending_approval: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  cancelled:        'text-red-400 bg-red-400/10 border-red-400/20',
  completed:        'text-teal-300 bg-teal/10 border-teal/20',
}

function formatDT(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function FacultyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [acting, setActing] = useState(null) // booking id being acted on

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { per_page: 20 }
      if (statusFilter !== 'all') params.status = statusFilter
      const r = await api.get('/api/faculty/bookings', { params })
      setBookings(r.data.items || [])
    } catch {
      setBookings([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id) => {
    setActing(id)
    try {
      await api.patch(`/api/faculty/bookings/${id}/approve`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not approve booking.')
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason (required):')
    if (!reason?.trim()) return
    setActing(id)
    try {
      await api.patch(`/api/faculty/bookings/${id}/reject`, { reason })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not reject booking.')
    } finally {
      setActing(null)
    }
  }

  const FILTERS = [
    { value: 'all',              label: 'All' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'confirmed',        label: 'Confirmed' },
    { value: 'completed',        label: 'Completed' },
    { value: 'cancelled',        label: 'Cancelled' },
  ]

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Active Bookings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cloud">Lab Bookings</h2>
        <p className="text-sm text-cloud/50 mt-0.5">Monitor and approve equipment bookings</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${statusFilter === f.value
                ? 'bg-teal/10 border-teal/40 text-teal-300'
                : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <CalendarX size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No bookings found</p>
          <p className="text-sm">Equipment bookings will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 hover:border-navy-600 transition-colors">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-cloud">{b.equipment_name || 'Unknown Equipment'}</h3>
                    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'text-cloud/40 border-cloud/10'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-cloud/40">
                    <span>Start: {formatDT(b.start_time)}</span>
                    <span>End:   {formatDT(b.end_time)}</span>
                    <span>Student: {b.student_id?.slice(-8)}</span>
                    {b.approved_at && <span>Approved: {formatDT(b.approved_at)}</span>}
                  </div>
                </div>

                {/* Approve / Reject for pending bookings */}
                {b.status === 'pending_approval' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApprove(b.id)}
                      disabled={acting === b.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
                      {acting === b.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(b.id)}
                      disabled={acting === b.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                      {acting === b.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
