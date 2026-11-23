import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthContext, useAuthProvider, useAuth } from './hooks/useAuth'
import LandingPage from './pages/LandingPage'
import StudentLoginPage from './pages/auth/StudentLoginPage'
import StudentRegisterPage from './pages/auth/StudentRegisterPage'
import FacultyLoginPage from './pages/auth/FacultyLoginPage'
import FacultyRegisterPage from './pages/auth/FacultyRegisterPage'
import StudentDashboard from './pages/student/StudentDashboard'
import EquipmentPage from './pages/student/EquipmentPage'
import RequestsPage from './pages/student/RequestsPage'
import BookingsPage from './pages/student/BookingsPage'
import NotificationsPage from './pages/student/NotificationsPage'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import ApprovalsPage from './pages/faculty/ApprovalsPage'
import FacultyBookingsPage from './pages/faculty/FacultyBookingsPage'
import FacultyEquipmentPage from './pages/faculty/FacultyEquipmentPage'
import FacultyReportsPage from './pages/faculty/FacultyReportsPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const auth = useAuthProvider()
  return (
    <AuthContext.Provider value={auth}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/faculty/login" element={<FacultyLoginPage />} />
        <Route path="/faculty/register" element={<FacultyRegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Student routes */}
        <Route path="/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/equipment" element={<ProtectedRoute role="student"><EquipmentPage /></ProtectedRoute>} />
        <Route path="/dashboard/requests" element={<ProtectedRoute role="student"><RequestsPage /></ProtectedRoute>} />
        <Route path="/dashboard/bookings" element={<ProtectedRoute role="student"><BookingsPage /></ProtectedRoute>} />
        <Route path="/dashboard/notifications" element={<ProtectedRoute role="student"><NotificationsPage /></ProtectedRoute>} />

        {/* Faculty routes */}
        <Route path="/faculty/dashboard" element={<ProtectedRoute role="faculty"><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/faculty/dashboard/approvals" element={<ProtectedRoute role="faculty"><ApprovalsPage /></ProtectedRoute>} />
        <Route path="/faculty/dashboard/bookings" element={<ProtectedRoute role="faculty"><FacultyBookingsPage /></ProtectedRoute>} />
        <Route path="/faculty/dashboard/equipment" element={<ProtectedRoute role="faculty"><FacultyEquipmentPage /></ProtectedRoute>} />
        <Route path="/faculty/dashboard/reports" element={<ProtectedRoute role="faculty"><FacultyReportsPage /></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  )
}
