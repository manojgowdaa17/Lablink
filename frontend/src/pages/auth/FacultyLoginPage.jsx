import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import api from '../../utils/api'
import { useAuth } from '../../hooks/useAuth'
import { Loader2 } from 'lucide-react'

export default function FacultyLoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', form)
      setUser(res.data.user)
      navigate('/faculty/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Faculty Sign In" subtitle="Manage lab access and approvals">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="faculty@university.edu"
          required
        />
        <FormField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-center text-sm text-cloud/50">
          Don't have an account?{' '}
          <Link to="/faculty/register" className="text-teal-300 hover:underline">
            Faculty Registration
          </Link>
        </p>
        <p className="text-center text-xs text-cloud/30">
          Student?{' '}
          <Link to="/login" className="text-teal-300 hover:underline">
            Student Login
          </Link>
          {' · '}
          <Link to="/admin/login" className="text-amber hover:underline">
            Admin Portal
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
