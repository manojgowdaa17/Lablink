import React, { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { LayoutDashboard, Search, FileText, Calendar, Bell, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../utils/api'
import NewRequestModal from '../../components/requests/NewRequestModal'
import FairScoreCard from '../../components/ai/FairScoreCard'

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/dashboard',               icon: LayoutDashboard },
  { label: 'Find Equipment', href: '/dashboard/equipment',     icon: Search },
  { label: 'My Requests',    href: '/dashboard/requests',      icon: FileText },
  { label: 'My Bookings',    href: '/dashboard/bookings',      icon: Calendar },
  { label: 'Notifications',  href: '/dashboard/notifications', icon: Bell },
]

const STATUS_COLORS = {
  submitted:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
  under_review: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  approved:     'text-green-400 bg-green-400/10 border-green-400/20',
  rejected:     'text-red-400 bg-red-400/10 border-red-400/20',
  cancelled:    'text-cloud/40 bg-cloud/5 border-cloud/10',
  draft:        'text-cloud/40 bg-cloud/5 border-cloud/10',
}

function RequestItem({ req, onCancel }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden hover:border-navy-600 transition-colors">
      <button className="w-full flex items-start justify-between p-5 text-left gap-4"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-semibold text-cloud truncate">{req.project_title}</h3>
            <span className={`text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || 'text-cloud/40'}`}>
              {req.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-cloud/50 line-clamp-2 mb-2">{req.project_description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-cloud/40">
            <span>Submitted: {req.created_at ? new Date(req.created_at).toLocaleDateString() : '—'}</span>
            {req.deadline && <span>Deadline: {new Date(req.deadline).toLocaleDateString()}</span>}
            <span>Equipment: {req.equipment_requested?.length || 0} items</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {['submitted', 'draft'].includes(req.status) && (
            <button onClick={e => { e.stopPropagation(); onCancel(req.id) }}
              className="text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-3 py-1.5 rounded-lg transition-all">
              Cancel
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-cloud/40" /> : <ChevronDown size={16} className="text-cloud/40" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-navy-700 p-5 flex flex-col gap-4">
          {req.faculty_notes && (
            <div className="flex items-start gap-2 text-sm text-cloud/50 bg-amber/5 border border-amber/20 rounded-xl p-3">
              <AlertCircle size={14} className="text-amber mt-0.5 flex-shrink-0" />
              <span><strong className="text-cloud/70">Faculty Note:</strong> {req.faculty_notes}</span>
            </div>
          )}
          {/* FairShare Score — only for active/pending requests */}
          {['submitted', 'under_review'].includes(req.status) && (
            <FairScoreCard projectId={req.id} projectTitle={req.project_title} />
          )}
        </div>
      )}
    </div>
  )
}

export default function RequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/projects/')
      setRequests(res.data.items || [])
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    if (!confirm('Cancel this request?')) return
    try {
      await api.patch(`/api/projects/${id}/cancel`)
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel.')
    }
  }

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="My Requests">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-cloud">Project Requests</h2>
          <p className="text-sm text-cloud/50 mt-0.5">Track your equipment access requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} />
          New Request
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-teal-300" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <FileText size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No requests yet</p>
          <p className="text-sm mb-6">Submit a project request to get started</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            New Request
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map(req => (
            <RequestItem key={req.id} req={req} onCancel={handleCancel} />
          ))}
        </div>
      )}

      {showModal && (
        <NewRequestModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load() }}
        />
      )}
    </DashboardLayout>
  )
}
