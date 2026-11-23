import React, { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import EquipmentCard from '../../components/equipment/EquipmentCard'
import EquipmentDetailModal from '../../components/equipment/EquipmentDetailModal'
import { useEquipment } from '../../hooks/useEquipment'
import {
  LayoutDashboard, Search, FileText, Calendar, Bell,
  ChevronLeft, ChevronRight, SlidersHorizontal, X
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Find Equipment', href: '/dashboard/equipment', icon: Search },
  { label: 'My Requests', href: '/dashboard/requests', icon: FileText },
  { label: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
]

const FALLBACK_EQUIPMENT = [
  { id: '1', name: 'NVIDIA DGX A100 Workstation', category: 'Computing', department: 'CS & AI Lab', lab_location: 'Engineering Block B, Room 204', status: 'available', short_description: '8× A100 GPUs, 320GB HBM2e memory for large-scale ML training.', available_quantity: 1, quantity: 1, access_level: 'supervised' },
  { id: '2', name: 'ZEISS Axio Observer', category: 'Biotech', department: 'Life Sciences Lab', lab_location: 'Science Block A, Room 101', status: 'available', short_description: 'Inverted fluorescence microscope with Apotome.2 optical sectioning.', available_quantity: 2, quantity: 2, access_level: 'supervised' },
  { id: '3', name: 'Keysight DSOX6004A Oscilloscope', category: 'Electronics', department: 'Electronics Lab', lab_location: 'Engineering Block A, Room 310', status: 'in-use', short_description: '4-channel 1GHz oscilloscope with 20GSa/s real-time sampling.', available_quantity: 1, quantity: 3, access_level: 'open' },
  { id: '4', name: 'FANUC LR Mate 200iD Robot Arm', category: 'Mechanical', department: 'Robotics Lab', lab_location: 'Engineering Block C, Room 405', status: 'available', short_description: '6-axis industrial robot arm, 7kg payload, ±0.02mm repeatability.', available_quantity: 1, quantity: 1, access_level: 'supervised' },
  { id: '5', name: 'Raspberry Pi Cluster (32 nodes)', category: 'Computing', department: 'IoT Research Lab', lab_location: 'Engineering Block B, Room 108', status: 'maintenance', short_description: '32-node Pi 4 cluster for distributed systems and edge AI research.', available_quantity: 0, quantity: 1, access_level: 'open' },
  { id: '6', name: '3D Systems ProJet MJP 2500', category: 'Mechanical', department: 'Design & Fab Lab', lab_location: 'Design Block, Room 201', status: 'available', short_description: 'Multi-Jet Printing with 32µm layer resolution for precision prototyping.', available_quantity: 1, quantity: 1, access_level: 'supervised' },
]

const CATEGORIES = ['All', 'Computing', 'Electronics', 'Biotech', 'Mechanical']
const STATUSES   = ['All', 'available', 'in-use', 'maintenance']

function SkeletonCard() {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6 animate-pulse">
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-24 bg-navy-700 rounded-full" />
        <div className="h-5 w-16 bg-navy-700 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-navy-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-navy-700 rounded mb-4" />
      <div className="h-12 bg-navy-700 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-9 flex-1 bg-navy-700 rounded-xl" />
        <div className="h-9 w-24 bg-navy-700 rounded-xl" />
      </div>
    </div>
  )
}

export default function EquipmentPage() {
  const { equipment, total, loading, fetchEquipment } = useEquipment()
  const [displayItems, setDisplayItems] = useState(FALLBACK_EQUIPMENT)
  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus]     = useState('All')
  const [page, setPage]         = useState(1)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showFilters, setShowFilters]   = useState(false)
  const perPage = 9

  // Debounce search + re-fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = { page, per_page: perPage }
      if (search) params.search = search
      if (category !== 'All') params.category = category
      if (status !== 'All') params.status = status
      fetchEquipment(params)
    }, 400)
    return () => clearTimeout(timer)
  }, [search, category, status, page, fetchEquipment])

  // Use API data if available, else fallback
  useEffect(() => {
    if (equipment.length > 0) {
      setDisplayItems(equipment)
    } else if (!loading) {
      // Filter fallback locally
      let filtered = FALLBACK_EQUIPMENT
      if (search) filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.category.toLowerCase().includes(search.toLowerCase()) ||
        e.department.toLowerCase().includes(search.toLowerCase())
      )
      if (category !== 'All') filtered = filtered.filter(e => e.category === category)
      if (status !== 'All') filtered = filtered.filter(e => e.status === status)
      setDisplayItems(filtered)
    }
  }, [equipment, loading, search, category, status])

  const totalPages = Math.max(1, Math.ceil((total || displayItems.length) / perPage))

  const statusColor = (s) => {
    if (s === 'available') return 'text-green-400 bg-green-400/10 border-green-400/20'
    if (s === 'in-use')    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    return 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  return (
    <DashboardLayout navItems={NAV_ITEMS} title="Find Equipment">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud/40" />
          <input
            type="text"
            placeholder="Search equipment, category, department…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full bg-navy-800 border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-cloud/40 hover:text-cloud">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-800 border-navy-700 text-cloud/60 hover:text-cloud'}`}
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-4 mb-6 flex flex-wrap gap-6">
          <div>
            <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => { setCategory(c); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${category === c ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-700 border-navy-600 text-cloud/60 hover:text-cloud'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => { setStatus(s); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${status === s ? 'bg-teal/10 border-teal/40 text-teal-300' : 'bg-navy-700 border-navy-600 text-cloud/60 hover:text-cloud'}`}>
                  {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-cloud/50">
          {loading ? 'Loading…' : `${total || displayItems.length} equipment found`}
        </p>
        <p className="text-xs text-cloud/30">Page {page} of {totalPages}</p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length: 6}).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-cloud/40">
          <Search size={48} className="mb-4 opacity-30" />
          <p className="text-lg font-medium">No equipment found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map(item => (
            <EquipmentCard
              key={item.id}
              item={item}
              onViewDetails={() => setSelectedItem(item)}
              statusColor={statusColor}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg bg-navy-800 border border-navy-700 text-cloud/60 hover:text-cloud disabled:opacity-30 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-cloud/60">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg bg-navy-800 border border-navy-700 text-cloud/60 hover:text-cloud disabled:opacity-30 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <EquipmentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </DashboardLayout>
  )
}
