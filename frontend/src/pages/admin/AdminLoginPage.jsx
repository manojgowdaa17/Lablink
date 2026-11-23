import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import FormField from '../../components/auth/FormField'
import api from '../../utils/api'
import { FlaskConical, Loader2, ShieldCheck, Terminal, ArrowRight } from 'lucide-react'

export default function AdminLoginPage() {
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode]         = useState('')
  const [step, setStep]         = useState(1)   // 1 = credentials, 2 = code
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // Step 1 — verify credentials and request terminal code
  const handleRequestCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/admin/request-code', { email, password })
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 — submit the code from the terminal
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/api/admin/login', { email, password, totp_code: code })
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/30 flex items-center justify-center">
              <FlaskConical size={22} className="text-amber" />
            </div>
            <span className="text-2xl font-bold text-cloud">
              Lab<span className="text-amber">Link</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center">
              <ShieldCheck size={20} className="text-amber" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-cloud">Admin Control Center</h1>
              <p className="text-xs text-cloud/50">
                {step === 1 ? 'Enter your credentials to continue' : 'Check the backend terminal for your code'}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2 mb-6">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-amber' : 'bg-navy-700'}`} />
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-amber' : 'bg-navy-700'}`} />
          </div>

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="flex flex-col gap-5">
              <FormField
                label="Admin Email"
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@lablink.edu"
                required
              />
              <FormField
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="btn-amber w-full flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                {loading ? 'Verifying…' : 'Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
              {/* Terminal hint banner */}
              <div className="flex items-start gap-3 bg-amber/5 border border-amber/20 rounded-xl p-4">
                <Terminal size={18} className="text-amber flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber mb-1">Check your backend terminal</p>
                  <p className="text-xs text-cloud/50 leading-relaxed">
                    A 6-digit code was printed in the terminal where <code className="text-amber/80">python run.py</code> is running. It expires in 5 minutes.
                  </p>
                </div>
              </div>

              <FormField
                label="Verification Code"
                type="text"
                name="code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                required
              />
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading}
                className="btn-amber w-full flex items-center justify-center gap-2 mt-1">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
              </button>
              <button type="button" onClick={() => { setStep(1); setError(''); setCode('') }}
                className="text-xs text-cloud/40 hover:text-cloud/70 transition-colors text-center">
                ← Back to credentials
              </button>
            </form>
          )}

          <p className="text-center text-xs text-cloud/30 mt-6">
            <Link to="/" className="hover:text-cloud/60 transition-colors">
              ← Back to LabLink
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
