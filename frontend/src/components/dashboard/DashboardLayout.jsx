import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical, Bell, Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import api from '../../utils/api'

export default function DashboardLayout({ children, navItems = [], title = 'Dashboard' }) {
  const { user, setUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch (_) {}
    setUser(null)
    navigate('/')
  }

  useEffect(() => {
    // Fetch unread notification count
    api.get('/api/notifications/')
      .then(res => setUnreadCount(res.data.unread || 0))
      .catch(() => {})
  }, [location.pathname])

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="min-h-screen bg-navy flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-64 bg-navy-800 border-r border-navy-700 flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-navy-700">
          <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center">
            <FlaskConical size={18} className="text-teal-300" />
          </div>
          <span className="text-lg font-bold text-cloud">
            Lab<span className="text-teal-300">Link</span>
          </span>
          <button
            className="ml-auto lg:hidden text-cloud/50 hover:text-cloud transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            const isNotif = item.href.includes('notifications')
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive
                    ? 'bg-teal/10 text-teal-300 border border-teal/20'
                    : 'text-cloud/60 hover:text-cloud hover:bg-navy-700'
                  }`}
              >
                {Icon && (
                  <div className="relative">
                    <Icon
                      size={18}
                      className={isActive ? 'text-teal-300' : 'text-cloud/40 group-hover:text-cloud/70'}
                    />
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-teal flex items-center justify-center text-white text-[9px] font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                )}
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto text-teal-300/60" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-teal-300">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-cloud truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-cloud/40 truncate capitalize">{user?.role || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-cloud/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-navy/95 backdrop-blur-md border-b border-navy-700 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg text-cloud/60 hover:text-cloud hover:bg-navy-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-cloud">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link
              to="/dashboard/notifications"
              className="relative p-2 rounded-lg text-cloud/50 hover:text-cloud hover:bg-navy-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-teal flex items-center justify-center text-white text-[9px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center">
              <span className="text-xs font-bold text-teal-300">{initials}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
