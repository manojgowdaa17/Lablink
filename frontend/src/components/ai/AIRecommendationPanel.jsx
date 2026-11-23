import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertTriangle, Package, ChevronDown, ChevronUp } from 'lucide-react'
import { useAIRecommendations } from '../../hooks/useAI'

export default function AIRecommendationPanel({ projectTitle, projectDescription, onSelectEquipment }) {
  const { recommendations, summary, prerequisites, loading, error, aiAvailable, getRecommendations } = useAIRecommendations()
  const [expanded, setExpanded] = useState(true)

  const canAnalyze = projectTitle?.trim().length > 3 && projectDescription?.trim().length >= 30

  const handleAnalyze = () => {
    if (canAnalyze) getRecommendations(projectTitle, projectDescription)
  }

  const confidenceColor = (c) => {
    if (c >= 0.8) return 'text-green-400'
    if (c >= 0.5) return 'text-amber'
    return 'text-cloud/40'
  }

  return (
    <div className="bg-teal/5 border border-teal/20 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal/20 flex items-center justify-center">
            <Sparkles size={14} className="text-teal-300" />
          </div>
          <span className="text-sm font-semibold text-teal-300">AI Equipment Advisor</span>
          {!aiAvailable && (
            <span className="text-xs text-cloud/40 bg-navy-700 border border-navy-600 px-2 py-0.5 rounded-full">Offline</span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="text-cloud/40" /> : <ChevronDown size={16} className="text-cloud/40" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          <p className="text-xs text-cloud/50">
            Describe your project above and click Analyze — Gemini will recommend equipment from the actual database.
          </p>

          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all w-full justify-center
              ${canAnalyze && !loading
                ? 'bg-teal/10 border-teal/40 text-teal-300 hover:bg-teal/20'
                : 'bg-navy-700 border-navy-600 text-cloud/30 cursor-not-allowed'}`}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Analyzing with Gemini…</>
              : <><Sparkles size={14} /> Analyze My Project</>
            }
          </button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertTriangle size={13} />
              {error}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-navy-700 border border-navy-600 rounded-xl p-3">
              <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest mb-1">AI Analysis</p>
              <p className="text-sm text-cloud/70 leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Prerequisites */}
          {prerequisites.length > 0 && (
            <div className="bg-amber/5 border border-amber/20 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={13} className="text-amber" />
                <p className="text-xs font-semibold text-amber uppercase tracking-widest">Prerequisites</p>
              </div>
              <ul className="flex flex-col gap-1">
                {prerequisites.map((p, i) => (
                  <li key={i} className="text-xs text-cloud/60 flex items-start gap-2">
                    <span className="text-amber mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-cloud/50 uppercase tracking-widest">Recommended Equipment</p>
              {recommendations.map((rec, i) => (
                <div key={i} className="bg-navy-700 border border-navy-600 rounded-xl p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Package size={14} className="text-teal-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-medium text-cloud">{rec.equipment_name}</p>
                      {rec.is_essential && (
                        <span className="text-xs text-teal-300 bg-teal/10 border border-teal/20 px-1.5 py-0.5 rounded-full">Essential</span>
                      )}
                      <span className={`text-xs font-medium ${confidenceColor(rec.confidence)}`}>
                        {Math.round((rec.confidence || 0) * 100)}% match
                      </span>
                    </div>
                    <p className="text-xs text-cloud/50 leading-relaxed">{rec.reason}</p>
                  </div>
                  {onSelectEquipment && (
                    <button
                      onClick={() => onSelectEquipment({ id: rec.equipment_id, name: rec.equipment_name })}
                      className="flex-shrink-0 text-xs text-teal-300 bg-teal/10 border border-teal/20 hover:bg-teal/20 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <CheckCircle size={12} /> Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty state after analysis */}
          {!loading && recommendations.length === 0 && summary && aiAvailable && (
            <p className="text-xs text-cloud/40 text-center py-2">No specific equipment recommended for this project.</p>
          )}
        </div>
      )}
    </div>
  )
}
