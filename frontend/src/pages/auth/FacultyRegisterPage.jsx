import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout'
import FormField from '../../components/auth/FormField'
import api from '../../utils/api'
import { Loader2, CheckCircle2 } from 'lucide-react'

const DEPARTMENTS = [
  'Computer Science',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Other',
]

export default function FacultyRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    department: '',
    password: '',
    confirm_password: '',
  })
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.department) errs.department = 'Please select a department.'
    if (!form.password) errs.password = 'Password is required.'
    if (form.password && form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm_password)
      errs.confirm_password = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        department: form.department,
        role: 'faculty',
        password: form.password,
        // employee_id sent as extra info (stored in name or separate field if backend supports)
      })
      setSuccess(true)
      setTimeout(() => navigate('/faculty/login'), 2000)
    } catch (err) {
      setApiError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Account Created!" subtitle="Redirecting you to login…">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-teal-300" />
          </div>
          <p className="text-cloud/70 text-sm text-center">
            Your faculty account has been created successfully.<br />
            You'll be redirected to the login page shortly.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Faculty Registration" subtitle="Create your faculty account to manage lab resources">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Full Name"
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Dr. Jane Smith"
          error={errors.name}
          required
        />
        <FormField
          label="University Email"
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="faculty@university.edu"
          error={errors.email}
          required
        />
        <FormField
          label="Faculty ID / Employee ID (optional)"
          type="text"
          name="employee_id"
          value={form.employee_id}
          onChange={handleChange}
          placeholder="e.g. FAC-2021-042"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-cloud/80">Department</label>
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            className={`w-full bg-navy-800 border ${
              errors.department ? 'border-red-500' : 'border-navy-700'
            } rounded-xl px-4 py-3 text-cloud text-sm focus:outline-none focus:border-teal transition-colors`}
          >
            <option value="" disabled className="text-cloud/30">Select your department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d} className="bg-navy-800">
                {d}
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="text-red-400 text-xs">{errors.department}</p>
          )}
        </div>
        <FormField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters, 1 uppercase, 1 digit"
          error={errors.password}
          required
        />
        <FormField
          label="Confirm Password"
          type="password"
          name="confirm_password"
          value={form.confirm_password}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirm_password}
          required
        />
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {apiError}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-1"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {loading ? 'Creating Account…' : 'Create Faculty Account'}
        </button>
        <p className="text-center text-sm text-cloud/50">
          Already have an account?{' '}
          <Link to="/faculty/login" className="text-teal-300 hover:underline">
            Faculty Sign In
          </Link>
        </p>
        <p className="text-center text-xs text-cloud/30">
          Student?{' '}
          <Link to="/register" className="text-teal-300 hover:underline">
            Student Registration
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
