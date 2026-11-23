import React, { useState } from 'react'
import { X, MapPin, Package, Shield, AlertTriangle, CalendarPlus, CheckCircle, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function EquipmentDetailModal({ item, onClose }) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime]     = useState('')
  const [bookingStatus, setBookingStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [bookingMsg, setBookingMsg]       = useState('')

  const handleBook = async () => {
    if (!startTime || !endTime) {
      setBookingMsg('Please select start and end times.')
      setBookingStatus('error')
      return
    }
    const startDt = new Date(startTime)
    const endDt   = new Date(endTime)
    if (isNaN(startDt) || isNaN(endDt)) {
      setBookingMsg('Invalid date/time selected.')
      setBookingStatus('error')
      return
    }
    if (endDt <= startDt) {
      setBookingMsg('End time must be after start time.')
      setBookingStatus('error')
      return
    }
    setBookingStatus('loading')
    setBookingMsg('')
    try {
      await api.post('/api/bookings/', {
        equipment_id: item.id,
        start_time: startDt.toISOString(),   // always sends UTC "Z" suffix
        end_time:   endDt.toISOString(),
      })
      setBookingStatus('success')
      setBookingMsg('Booking created! Check "My Bookings" for status.')
    } catch (err) {
      setBookingStatus('error')
      setBookingMsg(err.response?.data?.error || 'Booking failed. Please try again.')
    }
  }

  const statusColor = item.status === 'available' ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : item.status === 'in-use' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800 border border-navy-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-navy-700">
          <div className="flex-1 mr-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs font-semibold text-teal-300 bg-teal/10 border border-teal/20 px-2.5 py-1 rounded-full">
                {item.category}
              </span>
              <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full ${statusColor}`}>
                {item.status === 'available' ? 'Available' : item.status === 'in-use' ? 'In Use' : 'Maintenance'}
              </span>
              {item.access_level && (
                <span className="text-xs font-semibold text-amber bg-amber/10 border border-amber/20 px-2.5 py-1 rounded-full capitalize">
                  {item.access_level}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-cloud">{item.name}</h2>
            <div className="flex items-center gap-1 text-sm text-cloud/40 mt-1">
              <MapPin size={13} />
              <span>{item.lab_location || item.department}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-cloud/40 hover:text-cloud hover:bg-navy-700 transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {/* Description */}
          {item.full_description && (
            <div>
              <h3 className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-2">About</h3>
              <p className="text-sm text-cloud/70 leading-relaxed">{item.full_description}</p>
            </div>
          )}

          {/* Specifications */}
          {item.specifications && Object.keys(item.specifications).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(item.specifications).map(([k, v]) => (
                  <div key={k} className="bg-navy-700 border border-navy-600 rounded-xl px-3 py-2">
                    <p className="text-xs text-cloud/40 mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-cloud">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-cloud/60">
              <Package size={15} className="text-teal-300" />
              <span>{item.available_quantity ?? '—'} of {item.quantity ?? '—'} available</span>
            </div>
            {item.access_level === 'supervised' && (
              <div className="flex items-center gap-2 text-sm text-amber/70">
                <Shield size={15} />
                <span>Faculty supervision required</span>
              </div>
            )}
          </div>

          {/* Prerequisites */}
          {item.prerequisites && item.prerequisites.length > 0 && (
            <div className="bg-amber/5 border border-amber/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber" />
                <h3 className="text-xs font-semibold text-amber uppercase tracking-widest">Prerequisites</h3>
              </div>
              <ul className="flex flex-col gap-1">
                {item.prerequisites.map((p, i) => (
                  <li key={i} className="text-sm text-cloud/60 flex items-start gap-2">
                    <span className="text-amber mt-1">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Booking form */}
          {item.status === 'available' ? (
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-cloud mb-4 flex items-center gap-2">
                <CalendarPlus size={16} className="text-teal-300" />
                Book This Equipment
              </h3>
              {bookingStatus === 'success' ? (
                <div className="flex items-center gap-3 text-green-400 bg-green-400/10 border border-green-400/20 rounded-xl p-4">
                  <CheckCircle size={18} />
                  <p className="text-sm">{bookingMsg}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-cloud/60 block mb-1.5">Start Time</label>
                      <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-cloud/60 block mb-1.5">End Time</label>
                      <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                        min={startTime || new Date().toISOString().slice(0, 16)}
                        className="w-full bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
                    </div>
                  </div>
                  {bookingStatus === 'error' && bookingMsg && (
                    <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{bookingMsg}</p>
                  )}
                  <button onClick={handleBook} disabled={bookingStatus === 'loading'}
                    className="btn-primary flex items-center justify-center gap-2">
                    {bookingStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
                    {bookingStatus === 'loading' ? 'Creating Booking…' : 'Confirm Booking'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-4 text-center text-cloud/40 text-sm">
              {item.status === 'maintenance' ? '🔧 Equipment under maintenance — booking unavailable.' : '⏳ Equipment is currently in use. Check back later.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
