import React, { useState } from 'react'
import { Zap, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { useFairScore } from '../../hooks/useAI'

const SCORE_WEIGHTS = {
  deadline_urgency:         { label: 'Deadline Urgency',    weight: '40%', color: 'bg-red-400' },
  equipment_necessity:      { label: 'Equipment Necessity', weight: '25%', color: 'bg-blue-400' },
  fairness:                 { label: 'Usage Fairness',      weight: '20%', color: 'bg-teal-400' },
  availability_feasibility: { label: 'Slot Availability',   weight: '15%', color: 'bg-purple-400' },
}

export default function FairScoreCard({ projectId, projectTitle }) {
  const { score, explanation, loading, error, getScore } = useFairScore()
  const [showBreakdown, setShowBreakdown] = useState(false)

  const totalScore = score?.total_score ?? null
  const scoreColor = totalScore === null ? 'text-cloud/40'
    : totalScore >= 70 ? 'text-green-400'
    : totalScore >= 40 ? 'text-amber'
    : 'text-red-400'

  return (
    <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber/10 flex items-center justify-center">
            <Zap size={13} className="text-amber" />
          </div>
          <span className="text-xs font-semibold text-cloud/70">FairShare Priority</span>
        </div>
        {totalScore !== null && (
          <button
            onClick={() => setShowBreakdown(s => !s)}
            className="text-xs text-cloud/40 hover:text-cloud flex items-center gap-1 transition-colors"
          >
            <Info size={12} />
            {showBreakdown ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {totalScore === null ? (
        <button
          onClick={() => getScore(projectId)}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs font-medium hover:bg-amber/20 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          {loading ? 'Computing…' : 'Compute Priority Score'}
        </button>
      ) : (
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-3xl font-bold ${scoreColor}`}>{totalScore}</span>
            <span className="text-xs text-cloud/40">/ 100</span>
          </div>

          {/* Score bar */}
          <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${totalScore >= 70 ? 'bg-green-400' : totalScore >= 40 ? 'bg-amber' : 'bg-red-400'}`}
              style={{ width: `${totalScore}%` }}
            />
          </div>

          {explanation && (
            <p className="text-xs text-cloud/50 leading-relaxed mb-2">{explanation}</p>
          )}

          {showBreakdown && score?.breakdown && (
            <div className="mt-3 pt-3 border-t border-navy-600 flex flex-col gap-2">
              {Object.entries(score.breakdown).map(([key, raw]) => {
                const meta = SCORE_WEIGHTS[key] || { label: key, weight: '', color: 'bg-cloud/40' }
                const weighted = score.weighted?.[key] ?? 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cloud/60">{meta.label} <span className="text-cloud/30">({meta.weight})</span></span>
                      <span className="text-cloud/50">{raw.toFixed(1)} → <span className="text-cloud font-medium">{weighted.toFixed(1)}</span></span>
                    </div>
                    <div className="h-1 bg-navy-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${meta.color}`} style={{ width: `${raw}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}
