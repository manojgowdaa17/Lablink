import React from 'react'
import { MapPin, Package, ExternalLink, CalendarPlus } from 'lucide-react'

export default function EquipmentCard({ item, onViewDetails, statusColor }) {
  const sc = statusColor ? statusColor(item.status) : 'text-cloud/60'
  const statusLabel = item.status === 'available' ? 'Available'
    : item.status === 'in-use' ? 'In Use' : 'Maintenance'

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-5 flex flex-col gap-3 hover:border-teal/40 transition-all duration-300 group">
      {/* Top badges */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-teal-300 bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full">
          {item.category}
        </span>
        <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full flex items-center gap-1 ${sc}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'available' ? 'bg-green-400 animate-pulse' : item.status === 'in-use' ? 'bg-yellow-400' : 'bg-red-400'}`} />
          {statusLabel}
        </span>
      </div>

      {/* Name & location */}
      <div>
        <h3 className="font-bold text-cloud text-sm leading-tight mb-1 group-hover:text-teal-300 transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center gap-1 text-xs text-cloud/40">
          <MapPin size={11} />
          <span className="truncate">{item.lab_location || item.department}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-cloud/50 leading-relaxed line-clamp-2 flex-1">
        {item.short_description}
      </p>

      {/* Quantity */}
      <div className="flex items-center gap-1.5 text-xs text-cloud/40">
        <Package size={12} />
        <span>{item.available_quantity ?? '—'} of {item.quantity ?? '—'} available</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button onClick={onViewDetails}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-navy-700 border border-navy-600 text-xs font-medium text-cloud/60 hover:text-cloud hover:border-cloud/20 transition-all">
          <ExternalLink size={13} />
          View Details
        </button>
        {item.status === 'available' && (
          <button onClick={onViewDetails}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal/10 border border-teal/30 text-xs font-medium text-teal-300 hover:bg-teal/20 transition-all">
            <CalendarPlus size={13} />
            Book
          </button>
        )}
      </div>
    </div>
  )
}
