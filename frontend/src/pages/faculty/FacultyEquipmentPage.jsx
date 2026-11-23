import React, { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import {
  LayoutDashboard, ClipboardList, Calendar, Wrench, BarChart2,
  Loader2, Package, Search, ChevronLeft, ChevronRight
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
  available:   'text-green-400 bg-green-400/10 border-green-400/20',
  'in-use':    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  maintenance: 'text-red-400 bg-red-400/10 border-red-400/20',
  retired:     'text-cloud/30 bg-cloud/5 border-cloud/10',
}
const ACCESS_COLORS = {
  open:        'text-teal-300 bg-teal/10 border-teal/20',
  supervised:  'text-amber bg-amber/10 border-amber/20',
  restricted:  'text-red-400 bg-red-400/10 border-red-400/20',
}

export default function FacultyEquipmentPage() {
  const [items, setItems]     = useState([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus]   = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const PER_PAGE = 12

  const load = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = { page: p, per_page: PER_PAGE }
      if (search)   params.search   = search
      if (category) params.category = category
      if (status)   params.status   = status
      const res = await api.get('/api/equipment/', { params })
      setItems(res.data.items || [])
      setTotal(res.data.total || 0)
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [page, search, category, status])

  useEffect(() => {
    api.get('/api/equipment/categories').then(r => setCategories(r.data.categories || [])).catch(() => {})
  }, [])

  useEffect(() => { load(1); setPage(1) }, [search, category, status])
  useEffect(() => { load(page) }, [page])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Equipment">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-cloud">Lab Equipment</h2>
        <p className="text-sm text-cloud/50 mt-0.5">Browse all available lab equipment across departments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search equipment…"
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-9 pr-3 py-2 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-cloud/70 focus:outline-none focus:border-teal transition-colors">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-navy-800 border border-navy-700 rounded-xl px-3 py-2 text-sm text-cloud/70 focus:outline-none focus:border-teal transition-colors">
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="in-use">In Use</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-teal-300" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No equipment found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(eq => (
              <div key={eq.id} className="bg-navy-800 border border-navy-700 rounded-2xl p-5 hover:border-navy-600 transition-colors flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-cloud truncate">{eq.name}</h3>
                    <p className="text-xs text-cloud/40 mt-0.5">{eq.department}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-medium border px-2 py-0.5 rounded-full ${STATUS_COLORS[eq.status] || ''}`}>
                    {eq.status}
                  </span>
                </div>

                <p className="text-xs text-cloud/60 leading-relaxed line-clamp-2">{eq.short_description}</p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <span className="text-xs text-teal-300 bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full">{eq.category}</span>
                  <span className={`text-xs font-medium border px-2 py-0.5 rounded-full capitalize ${ACCESS_COLORS[eq.access_level] || ''}`}>
                    {eq.access_level}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-navy-700 text-xs text-cloud/40">
                  <span>📍 {eq.lab_location}</span>
                  <span>{eq.available_quantity ?? eq.quantity}/{eq.quantity} available</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-xs text-cloud/40">{total} total</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="p-1.5 rounded-lg text-cloud/50 hover:text-cloud hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-cloud/60">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                  className="p-1.5 rounded-lg text-cloud/50 hover:text-cloud hover:bg-navy-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
