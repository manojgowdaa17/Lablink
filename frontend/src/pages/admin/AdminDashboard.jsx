import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FlaskConical, LayoutDashboard, Users, Package, Calendar,
  Monitor, ShieldAlert, BarChart2, LogOut, Menu, X,
  RefreshCw, Loader2, CalendarCheck, Search, Plus, Trash2,
  CheckCircle, XCircle, Edit3, ChevronLeft, ChevronRight,
  UserCheck, UserX, AlertTriangle, TrendingUp,
} from 'lucide-react'
import api from '../../utils/api'

const SIDEBAR_SECTIONS = [
  { id: 'overview',   label: 'Overview',    icon: LayoutDashboard },
  { id: 'users',      label: 'Users',       icon: Users },
  { id: 'equipment',  label: 'Equipment',   icon: Package },
  { id: 'bookings',   label: 'Bookings',    icon: Calendar },
  { id: 'sessions',   label: 'Sessions',    icon: Monitor },
  { id: 'security',   label: 'Audit Logs',  icon: ShieldAlert },
  { id: 'analytics',  label: 'Analytics',   icon: BarChart2 },
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

function Pagination({ page, total, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-cloud/40">{total} total</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg text-cloud/50 hover:text-cloud hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft size={16} />
        </button>
        <span className="text-xs text-cloud/60">{page} / {totalPages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
          className="p-1.5 rounded-lg text-cloud/50 hover:text-cloud hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* ─── USERS SECTION ─────────────────────────────────────────── */
function UsersSection() {
  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 15 }
      if (search) params.search = search
      if (roleFilter) params.role = roleFilter
      const res = await api.get('/api/admin/panel/users', { params })
      setUsers(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [page, search, roleFilter])

  useEffect(() => { load(1); setPage(1) }, [search, roleFilter])
  useEffect(() => { load(page) }, [page])

  const toggle = async (id, isActive) => {
    const endpoint = isActive ? 'deactivate' : 'activate'
    try {
      await api.patch(`/api/admin/panel/users/${id}/${endpoint}`)
      load(page)
    } catch (err) { alert(err.response?.data?.error || 'Action failed.') }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud/40" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-9 pr-3 py-2 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors" />
        </div>
        <select value={roleFilter} onChange={e => setRole(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-cloud/70 focus:outline-none focus:border-teal transition-colors">
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-cloud/30"><Users size={40} className="mx-auto mb-3 opacity-30" /><p>No users found</p></div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-navy-700/50 last:border-0 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-cloud">{u.name}</td>
                  <td className="px-4 py-3 text-cloud/60 hidden sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize
                      ${u.role === 'faculty' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                        : 'text-teal-300 bg-teal/10 border-teal/20'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border
                      ${u.is_active !== false ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                      {u.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cloud/40 text-xs hidden md:table-cell">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(u.id, u.is_active !== false)}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all
                        ${u.is_active !== false
                          ? 'text-red-400/70 border-red-500/20 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5'
                          : 'text-green-400/70 border-green-500/20 hover:text-green-400 hover:border-green-500/40 hover:bg-green-500/5'}`}>
                      {u.is_active !== false ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={15} onPage={setPage} />
    </div>
  )
}

/* ─── EQUIPMENT SECTION ─────────────────────────────────────── */
const EMPTY_EQ = { name:'', category:'', department:'', lab_name:'', lab_location:'',
  short_description:'', status:'available', access_level:'open', quantity:1, is_featured: false }

function EquipmentSection() {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_EQ)
  const [editId, setEditId]     = useState(null)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/panel/equipment', { params: { page: p, per_page: 10 } })
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { load(page) }, [page])

  const openAdd = () => { setForm(EMPTY_EQ); setEditId(null); setErr(''); setShowForm(true) }
  const openEdit = (eq) => {
    setForm({ name: eq.name, category: eq.category, department: eq.department,
      lab_name: eq.lab_name, lab_location: eq.lab_location,
      short_description: eq.short_description, status: eq.status,
      access_level: eq.access_level, quantity: eq.quantity, is_featured: eq.is_featured })
    setEditId(eq.id); setErr(''); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditId(null); setErr('') }

  const handleSave = async () => {
    setSaving(true); setErr('')
    try {
      if (editId) {
        await api.patch(`/api/admin/panel/equipment/${editId}`, form)
      } else {
        await api.post('/api/admin/panel/equipment', form)
      }
      closeForm(); load(page)
    } catch (e) { setErr(e.response?.data?.error || 'Save failed.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try { await api.delete(`/api/admin/panel/equipment/${id}`); load(page) }
    catch (e) { alert(e.response?.data?.error || 'Delete failed.') }
  }

  const STATUS_COLORS = {
    available:   'text-green-400 bg-green-400/10 border-green-400/20',
    'in-use':    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    maintenance: 'text-red-400 bg-red-400/10 border-red-400/20',
    retired:     'text-cloud/30 bg-cloud/5 border-cloud/10',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={openAdd} className="flex items-center gap-2 btn-primary text-sm px-4 py-2">
          <Plus size={16} /> Add Equipment
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-navy-800 border border-teal/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-cloud">{editId ? 'Edit Equipment' : 'Add New Equipment'}</h3>
            <button onClick={closeForm} className="text-cloud/40 hover:text-cloud"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ['name','Name *'],['category','Category *'],['department','Department *'],
              ['lab_name','Lab Name *'],['lab_location','Lab Location *'],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs text-cloud/50 block mb-1">{label}</label>
                <input value={form[k]} onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
                  className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="text-xs text-cloud/50 block mb-1">Short Description *</label>
              <textarea value={form.short_description} rows={2}
                onChange={e => setForm(f => ({...f, short_description: e.target.value}))}
                className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors resize-none" />
            </div>
            <div>
              <label className="text-xs text-cloud/50 block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}
                className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors">
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cloud/50 block mb-1">Access Level</label>
              <select value={form.access_level} onChange={e => setForm(f => ({...f, access_level: e.target.value}))}
                className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors">
                <option value="open">Open</option>
                <option value="supervised">Supervised</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-cloud/50 block mb-1">Quantity</label>
              <input type="number" min={1} value={form.quantity}
                onChange={e => setForm(f => ({...f, quantity: parseInt(e.target.value) || 1}))}
                className="w-full bg-navy-700 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="is_featured" checked={!!form.is_featured}
                onChange={e => setForm(f => ({...f, is_featured: e.target.checked}))}
                className="w-4 h-4 accent-teal-400 rounded" />
              <label htmlFor="is_featured" className="text-sm text-cloud/70">Featured on landing page</label>
            </div>
          </div>
          {err && <p className="text-red-400 text-xs mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm px-5 py-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Equipment'}
            </button>
            <button onClick={closeForm} className="text-sm text-cloud/50 hover:text-cloud px-4 py-2 rounded-xl border border-navy-600 hover:border-navy-500 transition-all">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-cloud/30"><Package size={40} className="mx-auto mb-3 opacity-30" /><p>No equipment found</p></div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Access</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(eq => (
                <tr key={eq.id} className="border-b border-navy-700/50 last:border-0 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-cloud">{eq.name}</td>
                  <td className="px-4 py-3 text-cloud/60 hidden sm:table-cell">{eq.category}</td>
                  <td className="px-4 py-3 text-cloud/60 hidden md:table-cell">{eq.lab_location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[eq.status] || ''}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-amber/80 bg-amber/10 border border-amber/20 px-2 py-0.5 rounded-full capitalize">{eq.access_level}</span>
                  </td>
                  <td className="px-4 py-3 text-cloud/60">{eq.available_quantity ?? eq.quantity}/{eq.quantity}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg text-cloud/40 hover:text-teal-300 hover:bg-teal/10 transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(eq.id, eq.name)} className="p-1.5 rounded-lg text-cloud/40 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={10} onPage={setPage} />
    </div>
  )
}

/* ─── BOOKINGS SECTION ──────────────────────────────────────── */
function BookingsSection() {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [statusFilter, setStatus] = useState('')
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: 15 }
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/api/admin/panel/bookings', { params })
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load(1); setPage(1) }, [statusFilter])
  useEffect(() => { load(page) }, [page])

  const STATUS_COLORS = {
    confirmed:        'text-green-400 bg-green-400/10 border-green-400/20',
    pending_approval: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    cancelled:        'text-red-400 bg-red-400/10 border-red-400/20',
    completed:        'text-teal-300 bg-teal/10 border-teal/20',
    no_show:          'text-cloud/30 bg-cloud/5 border-cloud/10',
  }

  const fmtDt = iso => iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {['', 'confirmed', 'pending_approval', 'completed', 'cancelled', 'no_show'].map(s => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
              ${statusFilter === s ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}>
            {s === '' ? 'All' : s === 'pending_approval' ? 'Pending' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-cloud/30"><Calendar size={40} className="mx-auto mb-3 opacity-30" /><p>No bookings found</p></div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Equipment</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden sm:table-cell">Start</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden md:table-cell">End</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden lg:table-cell">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map(b => (
                <tr key={b.id} className="border-b border-navy-700/50 last:border-0 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-cloud">{b.equipment_name || b.equipment_id?.slice(-6)}</td>
                  <td className="px-4 py-3 text-cloud/60 hidden sm:table-cell">{fmtDt(b.start_time)}</td>
                  <td className="px-4 py-3 text-cloud/60 hidden md:table-cell">{fmtDt(b.end_time)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[b.status] || ''}`}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cloud/40 text-xs hidden lg:table-cell">{fmtDt(b.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={15} onPage={setPage} />
    </div>
  )
}

/* ─── SESSIONS SECTION ──────────────────────────────────────── */
function SessionsSection() {
  const [items, setItems]       = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [statusFilter, setStatus] = useState('active')
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/panel/sessions', { params: { page: p, per_page: 15, status: statusFilter } })
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { load(1); setPage(1) }, [statusFilter])
  useEffect(() => { load(page) }, [page])

  const revokeSession = async (id) => {
    if (!confirm('Revoke this session?')) return
    try { await api.patch(`/api/admin/panel/sessions/${id}/revoke`); load(page) }
    catch (e) { alert(e.response?.data?.error || 'Failed to revoke.') }
  }

  const fmtDt = iso => iso ? new Date(iso).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {['active', 'expired', 'revoked', 'all'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize
              ${statusFilter === s ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-cloud/30"><Monitor size={40} className="mx-auto mb-3 opacity-30" /><p>No sessions found</p></div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden sm:table-cell">IP</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden md:table-cell">Last Active</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id} className="border-b border-navy-700/50 last:border-0 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-cloud capitalize">{s.role}</td>
                  <td className="px-4 py-3 text-cloud/60 font-mono text-xs hidden sm:table-cell">{s.ip_address || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize
                      ${s.status === 'active' ? 'text-green-400 bg-green-400/10 border-green-400/20'
                        : s.status === 'expired' ? 'text-cloud/30 bg-cloud/5 border-cloud/10'
                        : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cloud/40 text-xs hidden md:table-cell">{fmtDt(s.last_active)}</td>
                  <td className="px-4 py-3 text-cloud/40 text-xs hidden lg:table-cell">{fmtDt(s.expires_at)}</td>
                  <td className="px-4 py-3">
                    {s.status === 'active' && (
                      <button onClick={() => revokeSession(s.id)}
                        className="text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-2.5 py-1.5 rounded-lg transition-all">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={15} onPage={setPage} />
    </div>
  )
}

/* ─── AUDIT LOGS (SECURITY) SECTION ────────────────────────── */
function SecuritySection() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/panel/audit-logs', { params: { page: p, per_page: 20 } })
      setLogs(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setLogs([]) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { load(page) }, [page])

  const ACTION_COLORS = {
    login:              'text-green-400 bg-green-400/10 border-green-400/20',
    login_failed:       'text-red-400 bg-red-400/10 border-red-400/20',
    user_deactivated:   'text-red-400 bg-red-400/10 border-red-400/20',
    user_activated:     'text-green-400 bg-green-400/10 border-green-400/20',
    equipment_added:    'text-teal-300 bg-teal/10 border-teal/20',
    equipment_deleted:  'text-red-400 bg-red-400/10 border-red-400/20',
    session_revoked:    'text-amber bg-amber/10 border-amber/20',
  }

  return (
    <div className="flex flex-col gap-4">
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-cloud/30"><ShieldAlert size={40} className="mx-auto mb-3 opacity-30" /><p>No audit events yet</p></div>
      ) : (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden sm:table-cell">Actor</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider hidden md:table-cell">Target</th>
                <th className="px-4 py-3 text-xs font-semibold text-cloud/40 uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-navy-700/50 last:border-0 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${ACTION_COLORS[log.action] || 'text-cloud/50 bg-cloud/5 border-cloud/10'}`}>
                      {log.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-cloud/60 capitalize hidden sm:table-cell">{log.actor_role}</td>
                  <td className="px-4 py-3 text-cloud/50 capitalize hidden md:table-cell">{log.target_type || '—'}</td>
                  <td className="px-4 py-3 text-cloud/40 text-xs">{log.created_at ? new Date(log.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} total={total} perPage={20} onPage={setPage} />
    </div>
  )
}

/* ─── ANALYTICS SECTION ─────────────────────────────────────── */
function AnalyticsSection() {
  const [depts, setDepts]       = useState([])
  const [bkStatus, setBkStatus] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [dRes, bRes] = await Promise.allSettled([
          api.get('/api/admin/panel/analytics/departments'),
          api.get('/api/admin/panel/analytics/bookings-by-status'),
        ])
        if (dRes.status === 'fulfilled') setDepts(dRes.value.data.departments || [])
        if (bRes.status === 'fulfilled') setBkStatus(bRes.value.data.data || [])
      } finally { setLoading(false) }
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-teal-300" /></div>

  const maxDept   = Math.max(1, ...depts.map(d => d.total))
  const totalBk   = bkStatus.reduce((s, x) => s + x.count, 0) || 1
  const BK_COLORS = { confirmed: '#10b981', pending_approval: '#f59e0b', cancelled: '#ef4444', completed: '#5eead4', no_show: '#94a3b8' }

  return (
    <div className="flex flex-col gap-6">
      {/* Equipment by Department */}
      <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
        <h3 className="font-semibold text-cloud mb-5 flex items-center gap-2"><TrendingUp size={16} className="text-teal-300" /> Equipment by Department</h3>
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
        <h3 className="font-semibold text-cloud mb-5 flex items-center gap-2"><BarChart2 size={16} className="text-teal-300" /> Bookings by Status</h3>
        {bkStatus.length === 0 ? (
          <p className="text-cloud/30 text-sm text-center py-6">No bookings yet</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
  )
}

/* ─── MAIN DASHBOARD ─────────────────────────────────────────── */
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

  const navigate_section = (id) => { setActiveSection(id); setSidebarOpen(false) }

  const renderContent = () => {
    switch (activeSection) {
      case 'users':     return <UsersSection />
      case 'equipment': return <EquipmentSection />
      case 'bookings':  return <BookingsSection />
      case 'sessions':  return <SessionsSection />
      case 'security':  return <SecuritySection />
      case 'analytics': return <AnalyticsSection />
      default:          return renderOverview()
    }
  }

  const renderOverview = () => (
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
            { label: 'Database',  status: health.database },
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cloud">Recent Audit Logs</h3>
            <button onClick={() => navigate_section('security')} className="text-xs text-teal-300/70 hover:text-teal-300 transition-colors">View all →</button>
          </div>
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
                  <span className="text-xs text-cloud/40 bg-navy-700 border border-navy-600 px-2 py-0.5 rounded-lg capitalize">{log.target_type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Sessions */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cloud">Active Sessions</h3>
            <button onClick={() => navigate_section('sessions')} className="text-xs text-teal-300/70 hover:text-teal-300 transition-colors">View all →</button>
          </div>
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
                  <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-lg">active</span>
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
            { label: 'Manage Users',  icon: Users,       section: 'users' },
            { label: 'Equipment',     icon: Package,     section: 'equipment' },
            { label: 'View Sessions', icon: Monitor,     section: 'sessions' },
            { label: 'Audit Logs',    icon: ShieldAlert, section: 'security' },
          ].map(a => (
            <button key={a.section} onClick={() => navigate_section(a.section)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-navy-700 border border-navy-600 hover:border-amber/30 hover:bg-amber/5 transition-all group">
              <a.icon size={20} className="text-amber/60 group-hover:text-amber transition-colors" />
              <span className="text-xs font-medium text-cloud/60 group-hover:text-cloud transition-colors">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy flex">
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
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {SIDEBAR_SECTIONS.map(s => {
            const Icon = s.icon
            const isActive = activeSection === s.id
            return (
              <button key={s.id} onClick={() => navigate_section(s.id)}
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
              <span className="text-cloud/40 font-normal text-sm ml-2 capitalize">
                / {SIDEBAR_SECTIONS.find(s => s.id === activeSection)?.label || activeSection}
              </span>
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
