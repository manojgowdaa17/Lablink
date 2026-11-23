import React, { useEffect, useState } from 'react'
import { ArrowRight, Cpu, Microscope, Zap, Settings, Server, Printer } from 'lucide-react'
import axios from 'axios'

const FALLBACK_EQUIPMENT = [
  {
    name: 'NVIDIA DGX A100 Workstation',
    category: 'Computing',
    department: 'CS & AI Lab',
    status: 'available',
    short_description: '8× A100 GPUs, 320GB HBM2e memory for large-scale ML training.',
  },
  {
    name: 'ZEISS Axio Observer',
    category: 'Biotech',
    department: 'Life Sciences Lab',
    status: 'available',
    short_description: 'Inverted fluorescence microscope with Apotome.2 optical sectioning.',
  },
  {
    name: 'Keysight DSOX6004A Oscilloscope',
    category: 'Electronics',
    department: 'Electronics Lab',
    status: 'in-use',
    short_description: '4-channel 1GHz oscilloscope with 20GSa/s real-time sampling.',
  },
  {
    name: 'FANUC LR Mate 200iD Robot Arm',
    category: 'Mechanical',
    department: 'Robotics Lab',
    status: 'available',
    short_description: '6-axis industrial robot arm, 7kg payload, ±0.02mm repeatability.',
  },
  {
    name: 'Raspberry Pi Cluster (32 nodes)',
    category: 'Computing',
    department: 'IoT Research Lab',
    status: 'maintenance',
    short_description: '32-node Pi 4 cluster for distributed systems and edge AI research.',
  },
  {
    name: '3D Systems ProJet MJP 2500',
    category: 'Mechanical',
    department: 'Design & Fab Lab',
    status: 'available',
    short_description: 'Multi-Jet Printing with 32µm layer resolution for precision prototyping.',
  },
]

const CATEGORY_ICONS = {
  Computing: Cpu,
  Biotech: Microscope,
  Electronics: Zap,
  Mechanical: Settings,
  default: Server,
}

const FILTERS = ['All', 'Electronics', 'Mechanical', 'Computing', 'Biotech']

function StatusBadge({ status }) {
  const map = {
    available: {
      label: 'Available',
      dot: 'bg-green-400',
      text: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/20',
    },
    'in-use': {
      label: 'In Use',
      dot: 'bg-yellow-400',
      text: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20',
    },
    maintenance: {
      label: 'Maintenance',
      dot: 'bg-red-400',
      text: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
    },
  }
  const s = map[status] || map['maintenance']
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status === 'available' ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  )
}

function EquipmentCard({ item }) {
  const Icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.default
  return (
    <div className="card group flex flex-col h-full">
      {/* Icon + category */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
          <Icon size={20} className="text-teal-400" />
        </div>
        <span className="text-xs font-semibold text-teal-300 bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full">
          {item.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-cloud text-sm leading-snug mb-1 group-hover:text-teal-300 transition-colors">
        {item.name}
      </h3>
      <p className="text-xs text-cloud/40 mb-3">{item.department}</p>

      {/* Description */}
      <p className="text-xs text-cloud/60 leading-relaxed flex-1 mb-4">
        {item.short_description}
      </p>

      {/* Footer: status + CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-navy-700 mt-auto">
        <StatusBadge status={item.status} />
        <button
          className="flex items-center gap-1 text-xs font-semibold text-teal hover:text-teal-300 transition-colors"
          disabled={item.status === 'maintenance'}
        >
          Request Access
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

export default function FeaturedEquipment() {
  const [equipment, setEquipment] = useState(FALLBACK_EQUIPMENT)
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    axios
      .get('/api/public/featured-equipment')
      .then((res) => {
        if (res.data && res.data.length > 0) setEquipment(res.data)
      })
      .catch(() => {/* keep fallback */})
  }, [])

  const filtered =
    activeFilter === 'All'
      ? equipment
      : equipment.filter((item) => item.category === activeFilter)

  return (
    <section id="explore" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-teal/10 border border-teal/30 text-teal-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
            <Server size={12} />
            Campus Equipment Catalogue
          </div>
          <h2 className="section-title">Explore Campus Resources</h2>
          <p className="section-subtitle mx-auto">
            Browse cutting-edge equipment across all university departments. AI-matched to your project needs.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all duration-200 ${
                activeFilter === f
                  ? 'bg-teal text-white border-teal'
                  : 'bg-navy-800 text-cloud/60 border-navy-700 hover:border-teal/40 hover:text-teal-300'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Equipment grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <EquipmentCard key={item.name} item={item} />
          ))}
        </div>

        {/* View all CTA */}
        <div className="text-center mt-10">
          <button className="btn-secondary inline-flex items-center gap-2">
            View All Equipment
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}
