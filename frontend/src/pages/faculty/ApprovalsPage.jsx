import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2,
  Loader2, CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp,
  User, CalendarClock, Package, AlertCircle
} from 'lucide-react'
import api from '../../utils/api'
import RankedRequestsPanel from './RankedRequestsPanel'

const NAV_ITEMS = [
  { label: 'Dashboard',         href: '/faculty/dashboard',          icon: LayoutDashboard },
  { label: 'Pending Approvals', href: '/faculty/dashboard/approvals', icon: ClipboardList },
  { label: 'Active Bookings',   href: '/faculty/dashboard/bookings',  icon: Calendar },
  { label: 'Equipment',         href: '/faculty/dashboard/equipment', icon: Wrench },
  { label: 'Reports',           href: '/faculty/dashboard/reports',   icon: BarChart2 },
]

const STATUS_COLORS = {
  submitted:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  under_review: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  approved:     'text-green-400 bg-green-400/10 border-green-400/20',
  rejected:     'text-red-400 bg-red-400/10 border-red-400/20',
}

function RequestCard({ req, onAction }) {
  const [expanded, setExpanded]   = useState(false)
  const [notes, setNotes]         = useState('')
  const [acting, setActing]       = useState(null) // 'approve'|'reject'|'suggest'
  const [actionError, setActionError] = useState('')

  const handleAction = async (type) => {
    if ((type === 'reject' || type === 'suggest') && !notes.trim()) {
      setActionError(type === 'reject' ? 'Rejection reason is required.' : 'Suggestion message is required.')
      return
    }
    setActing(type)
    setActionError('')
    try {
      const endpoint = type === 'approve'
        ? `/api/faculty/requests/${req.id}/approve`
        : type === 'reject'
          ? `/api/faculty/requests/${req.id}/reject`
          : `/api/faculty/requests/${req.id}/suggest`
      const body = type === 'approve'
        ? { faculty_notes: notes }
        : type === 'reject'
          ? { faculty_notes: notes }
          : { suggestion: notes }
      await api.patch(endpoint, body)
      onAction()
    } catch (err) {
      setActionError(err.response?.data?.error || 'Action failed.')
      setActing(null)
    }
  }

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden hover:border-navy-600 transition-colors">
      {/* Header row */}
      <button className="w-full flex items-start justify-between p-5 text-left gap-4"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-cloud truncate">{req.project_title}</h3>
            <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || 'text-cloud/40 border-cloud/10'}`}>
              {req.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-cloud/40">
            <span className="flex items-center gap-1"><User size={11} />{req.student_name}</span>
            {req.deadline && <span className="flex items-center gap-1"><CalendarClock size={11} />Due: {new Date(req.deadline).toLocaleDateString()}</span>}
            <span className="flex items-center gap-1"><Package size={11} />{req.equipment_requested?.length || 0} equipment</span>
            <span>Submitted: {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-cloud/40">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-navy-700 p-5 flex flex-col gap-5">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-2">Project Description</p>
            <p className="text-sm text-cloud/70 leading-relaxed">{req.project_description}</p>
          </div>

          {/* Equipment details */}
          {req.equipment_details && req.equipment_details.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-2">Requested Equipment</p>
              <div className="flex flex-col gap-2">
                {req.equipment_details.map(eq => (
                  <div key={eq.id} className="flex items-center justify-between bg-navy-700 border border-navy-600 rounded-xl px-3 py-2">
                    <span className="text-sm text-cloud">{eq.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-cloud/40">{eq.department}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${eq.status === 'available' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                        {eq.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timing */}
          {(req.preferred_start_date || req.preferred_end_date) && (
            <div className="grid grid-cols-2 gap-3">
              {req.preferred_start_date && (
                <div className="bg-navy-700 border border-navy-600 rounded-xl p-3">
                  <p className="text-xs text-cloud/40 mb-1">Preferred Start</p>
                  <p className="text-sm text-cloud">{new Date(req.preferred_start_date).toLocaleString()}</p>
                </div>
              )}
              {req.preferred_end_date && (
                <div className="bg-navy-700 border border-navy-600 rounded-xl p-3">
                  <p className="text-xs text-cloud/40 mb-1">Preferred End</p>
                  <p className="text-sm text-cloud">{new Date(req.preferred_end_date).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Action area — only for submitted/under_review */}
          {['submitted', 'under_review'].includes(req.status) && (
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-4">
              <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-3">Faculty Response</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes, approval comments, rejection reason, or alternative suggestion…"
                rows={3}
                className="w-full bg-navy border border-navy-600 rounded-xl px-4 py-3 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors resize-none mb-3"
              />
              {actionError && (
                <div className="flex items-center gap-2 text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertCircle size={13} />
                  {actionError}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleAction('approve')} disabled={!!acting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-all disabled:opacity-50">
                  {acting === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button onClick={() => handleAction('reject')} disabled={!!acting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50">
                  {acting === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </button>
                <button onClick={() => handleAction('suggest')} disabled={!!acting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber/10 border border-amber/30 text-amber text-sm font-medium hover:bg-amber/20 transition-all disabled:opacity-50">
                  {acting === 'suggest' ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  Suggest Alternative
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [statusFilter, setStatusFilter] = useState('submitted')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/faculty/requests', { params: { status: statusFilter, per_page: 20 } })
      setRequests(res.data.items || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  // Enrich each request with equipment details
  const loadWithDetails = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/faculty/requests', { params: { status: statusFilter, per_page: 20 } })
      const items = res.data.items || []
      // Fetch details for each
      const enriched = await Promise.all(items.map(async (item) => {
        try {
          const detail = await api.get(`/api/faculty/requests/${item.id}`)
          return detail.data
        } catch {
          return item
        }
      }))
      setRequests(enriched)
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadWithDetails() }, [statusFilter])

  const FILTERS = [
    { value: 'submitted',    label: 'Pending' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved',     label: 'Approved' },
    { value: 'rejected',     label: 'Rejected' },
    { value: 'all',          label: 'All' },
  ]

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Pending Approvals">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cloud">Project Requests</h2>
        <p className="text-sm text-cloud/50 mt-0.5">Review and act on student equipment access requests</p>
      </div>

      {/* FairShare Ranking Panel — shown for submitted/all filters */}
      {(statusFilter === 'submitted' || statusFilter === 'all') && (
        <div className="mb-6">
          <RankedRequestsPanel />
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all
              ${statusFilter === f.value
                ? 'bg-teal/10 border-teal/40 text-teal-300'
                : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <ClipboardList size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No requests found</p>
          <p className="text-sm">Student project requests will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map(req => (
            <RequestCard key={req.id} req={req} onAction={loadWithDetails} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
