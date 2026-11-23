import React, { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Loader2, CheckCircle, Search, Package } from 'lucide-react'
import api from '../../utils/api'
import AIRecommendationPanel from '../ai/AIRecommendationPanel'

const STEPS = ['Project Details', 'Select Equipment', 'Review & Submit']

export default function NewRequestModal({ onClose, onSuccess }) {
  const [step, setStep]   = useState(0)
  const [form, setForm]   = useState({
    project_title: '', project_description: '',
    deadline: '', duration_hours: 2,
  })
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [eqSearch, setEqSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)

  useEffect(() => {
    api.get('/api/equipment/', { params: { per_page: 20, search: eqSearch } })
      .then(res => setEquipmentList(res.data.items || []))
      .catch(() => setEquipmentList([]))
  }, [eqSearch])

  const toggleEquipment = (item) => {
    setSelectedEquipment(prev =>
      prev.find(e => e.id === item.id)
        ? prev.filter(e => e.id !== item.id)
        : [...prev, item]
    )
  }

  const addEquipmentFromAI = (item) => {
    setSelectedEquipment(prev =>
      prev.find(e => e.id === item.id) ? prev : [...prev, item]
    )
  }

  const validate = () => {
    if (step === 0) {
      if (!form.project_title.trim()) return 'Project title is required.'
      if (form.project_description.trim().length < 50) return 'Description must be at least 50 characters.'
      return ''
    }
    return ''
  }

  const next = () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/projects/', {
        ...form,
        equipment_requested: selectedEquipment.map(e => e.id),
      })
      setDone(true)
      setTimeout(onSuccess, 1500)
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-navy-800 border border-navy-700 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700 sticky top-0 bg-navy-800 z-10">
          <div>
            <h2 className="font-bold text-cloud">New Project Request</h2>
            <p className="text-xs text-cloud/40 mt-0.5">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-cloud/40 hover:text-cloud hover:bg-navy-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex px-6 pt-4 gap-2">
          {STEPS.map((s, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-teal' : 'bg-navy-700'}`} />
          ))}
        </div>

        <div className="p-6">
          {done ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <CheckCircle size={48} className="text-teal-300" />
              <p className="font-semibold text-cloud">Request submitted!</p>
              <p className="text-sm text-cloud/50">Redirecting to your requests…</p>
            </div>
          ) : step === 0 ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-cloud/80 block mb-1.5">Project Title *</label>
                <input type="text" value={form.project_title}
                  onChange={e => setForm(f => ({...f, project_title: e.target.value}))}
                  placeholder="e.g. Deep Learning-based Plant Disease Detection"
                  className="w-full bg-navy border border-navy-700 rounded-xl px-4 py-3 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div>
                <label className="text-sm font-medium text-cloud/80 block mb-1.5">Project Description * <span className="text-cloud/40 font-normal">(min 50 chars)</span></label>
                <textarea value={form.project_description}
                  onChange={e => setForm(f => ({...f, project_description: e.target.value}))}
                  placeholder="Describe your project, its objectives, methodology, and why you need specific equipment…"
                  rows={5}
                  className="w-full bg-navy border border-navy-700 rounded-xl px-4 py-3 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors resize-none" />
                <p className="text-xs text-cloud/30 mt-1">{form.project_description.length} / min 50</p>
              </div>

              {/* AI Recommendation Panel */}
              <AIRecommendationPanel
                projectTitle={form.project_title}
                projectDescription={form.project_description}
                onSelectEquipment={addEquipmentFromAI}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-cloud/80 block mb-1.5">Project Deadline</label>
                  <input type="date" value={form.deadline}
                    onChange={e => setForm(f => ({...f, deadline: e.target.value}))}
                    className="w-full bg-navy border border-navy-700 rounded-xl px-4 py-3 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-medium text-cloud/80 block mb-1.5">Est. Duration (hours)</label>
                  <input type="number" min={1} max={72} value={form.duration_hours}
                    onChange={e => setForm(f => ({...f, duration_hours: parseInt(e.target.value) || 2}))}
                    className="w-full bg-navy border border-navy-700 rounded-xl px-4 py-3 text-sm text-cloud focus:outline-none focus:border-teal transition-colors" />
                </div>
              </div>
              {/* Show AI-added equipment preview */}
              {selectedEquipment.length > 0 && (
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-teal-300 mb-2">Pre-selected by AI ({selectedEquipment.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.map(e => (
                      <span key={e.id} className="text-xs bg-teal/10 border border-teal/20 text-teal-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                        {e.name && e.name.length > 25 ? e.name.slice(0, 25) + '…' : e.name}
                        <button onClick={() => toggleEquipment(e)} className="ml-1 text-teal-300/60 hover:text-teal-300">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cloud/40" />
                <input type="text" value={eqSearch} onChange={e => setEqSearch(e.target.value)}
                  placeholder="Search equipment to add…"
                  className="w-full bg-navy border border-navy-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-cloud placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors" />
              </div>
              <div className="max-h-64 overflow-y-auto flex flex-col gap-2 pr-1">
                {equipmentList.length === 0 ? (
                  <p className="text-center text-cloud/40 text-sm py-8">No equipment found</p>
                ) : equipmentList.map(eq => {
                  const selected = selectedEquipment.some(e => e.id === eq.id)
                  return (
                    <button key={eq.id} onClick={() => toggleEquipment(eq)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selected ? 'bg-teal/10 border-teal/40' : 'bg-navy border-navy-700 hover:border-navy-600'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border ${selected ? 'bg-teal border-teal' : 'border-navy-600'}`}>
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cloud truncate">{eq.name}</p>
                        <p className="text-xs text-cloud/40">{eq.category} · {eq.department}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0
                        ${eq.status === 'available' ? 'text-green-400 border-green-400/30 bg-green-400/10' : 'text-cloud/40 border-cloud/10'}`}>
                        {eq.status}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedEquipment.length > 0 && (
                <div className="bg-teal/5 border border-teal/20 rounded-xl p-3">
                  <p className="text-xs font-semibold text-teal-300 mb-2">Selected ({selectedEquipment.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEquipment.map(e => (
                      <span key={e.id} className="text-xs bg-teal/10 border border-teal/20 text-teal-300 px-2.5 py-1 rounded-full flex items-center gap-1">
                        {e.name.length > 25 ? e.name.slice(0, 25) + '…' : e.name}
                        <button onClick={() => toggleEquipment(e)} className="ml-1 text-teal-300/60 hover:text-teal-300">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-navy border border-navy-700 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-3">Project Summary</h3>
                <p className="font-semibold text-cloud mb-1">{form.project_title}</p>
                <p className="text-sm text-cloud/50 line-clamp-3 mb-3">{form.project_description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-cloud/40">
                  {form.deadline && <span>Deadline: {new Date(form.deadline).toLocaleDateString()}</span>}
                  <span>Duration: {form.duration_hours}h</span>
                </div>
              </div>
              {selectedEquipment.length > 0 && (
                <div className="bg-navy border border-navy-700 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-3">Equipment Requested ({selectedEquipment.length})</h3>
                  <div className="flex flex-col gap-2">
                    {selectedEquipment.map(e => (
                      <div key={e.id} className="flex items-center gap-2 text-sm text-cloud/70">
                        <Package size={13} className="text-teal-300 flex-shrink-0" />
                        {e.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-3">{error}</p>
          )}
        </div>

        {/* Footer nav */}
        {!done && (
          <div className="flex items-center justify-between p-6 pt-0">
            <button onClick={step === 0 ? onClose : () => { setStep(s => s - 1); setError('') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-cloud/60 hover:text-cloud bg-navy-700 hover:bg-navy-600 transition-all">
              <ChevronLeft size={16} />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={next}
                className="btn-primary flex items-center gap-2 text-sm">
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="btn-primary flex items-center gap-2 text-sm">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
