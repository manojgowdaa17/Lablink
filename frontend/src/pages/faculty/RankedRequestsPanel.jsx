import React, { useEffect, useState } from 'react'
import { Zap, Loader2, TrendingUp, ArrowUpDown } from 'lucide-react'
import api from '../../utils/api'

export default function RankedRequestsPanel() {
  const [ranked, setRanked] = useState([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/ai/rank')
      setRanked(res.data.ranked || [])
      setLoaded(true)
    } catch {
      setRanked([])
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s) =>
    s >= 70 ? 'text-green-400' : s >= 40 ? 'text-amber' : 'text-red-400'

  return (
    <div className="bg-navy-800 border border-navy-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-amber" />
          </div>
          <div>
            <h3 className="font-semibold text-cloud">FairShare Priority Ranking</h3>
            <p className="text-xs text-cloud/40">Requests ranked by allocation algorithm</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber/10 border border-amber/20 text-amber text-xs font-medium hover:bg-amber/20 transition-all disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowUpDown size={12} />}
          {loaded ? 'Refresh' : 'Compute Ranking'}
        </button>
      </div>

      {!loaded ? (
        <div className="flex flex-col items-center justify-center py-8 text-cloud/30">
          <Zap size={32} className="mb-2 opacity-30" />
          <p className="text-sm">Click &quot;Compute Ranking&quot; to run FairShare algorithm</p>
        </div>
      ) : ranked.length === 0 ? (
        <p className="text-center text-cloud/40 text-sm py-6">No pending requests to rank.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-700">
                <th className="text-left text-xs font-semibold text-cloud/40 uppercase tracking-widest px-3 py-2">#</th>
                <th className="text-left text-xs font-semibold text-cloud/40 uppercase tracking-widest px-3 py-2">Project</th>
                <th className="text-left text-xs font-semibold text-cloud/40 uppercase tracking-widest px-3 py-2">Student</th>
                <th className="text-right text-xs font-semibold text-cloud/40 uppercase tracking-widest px-3 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((r, i) => (
                <tr key={r.project_id} className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors">
                  <td className="px-3 py-3 text-cloud/40 font-mono text-xs">{i + 1}</td>
                  <td className="px-3 py-3">
                    <p className="font-medium text-cloud truncate max-w-[200px]">{r.project_title}</p>
                    <div className="flex gap-3 mt-0.5">
                      {Object.entries(r.breakdown).slice(0, 2).map(([k, v]) => (
                        <span key={k} className="text-xs text-cloud/30">{k.replace('_', ' ')}: {v}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-cloud/60">{r.student_name}</td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-lg font-bold ${scoreColor(r.total_score)}`}>{r.total_score}</span>
                    <span className="text-xs text-cloud/30 ml-1">/100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
