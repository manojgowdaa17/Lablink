import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormField({ label, type = 'text', error, ...props }) {
  const [showPass, setShowPass] = useState(false)
  const isPassword = type === 'password'
  const inputType  = isPassword ? (showPass ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-cloud/80">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className={`w-full bg-navy-800 border ${
            error ? 'border-red-500' : 'border-navy-700'
          } rounded-xl px-4 py-3 text-cloud text-sm placeholder-cloud/30 focus:outline-none focus:border-teal transition-colors`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-cloud/40 hover:text-cloud/70 transition-colors"
            tabIndex={-1}
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
