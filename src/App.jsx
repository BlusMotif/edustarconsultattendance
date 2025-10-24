import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AttendancePage from './AttendancePage'
import AdminPage from './AdminPage'
import { AuthProvider } from './AuthProvider'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AttendancePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}