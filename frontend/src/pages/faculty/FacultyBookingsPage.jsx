import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2, Loader2, CalendarX } from 'lucide-react'
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

  useEffect(() => {
    api.get('/api/faculty/bookings', { params: { per_page: 20 } })
      .then(r => setBookings(r.data.items || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Active Bookings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cloud">Lab Bookings</h2>
        <p className="text-sm text-cloud/50 mt-0.5">Monitor confirmed and pending equipment bookings</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <CalendarX size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No active bookings</p>
          <p className="text-sm">Confirmed equipment bookings will appear here</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                {['Equipment','Student','Start','End','Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-cloud/40 uppercase tracking-widest px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id} className="border-b border-navy-700/50 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-cloud">{b.equipment_name}</td>
                  <td className="px-4 py-3 text-cloud/60">{b.student_id?.slice(-8)}</td>
                  <td className="px-4 py-3 text-cloud/60">{formatDT(b.start_time)}</td>
                  <td className="px-4 py-3 text-cloud/60">{formatDT(b.end_time)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status] || 'text-cloud/40 border-cloud/10'}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  )
}
