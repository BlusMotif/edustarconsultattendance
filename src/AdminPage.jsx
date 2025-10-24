import React from 'react'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import { useAuth } from './AuthProvider'
import { Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'

import logo from '/logo.jpg'

export default function AdminPage() {
  const { user } = useAuth()

  return (
    <div className="app-container">
      <div className="hero-section">
        <div className="hero-content">
          <div className="brand-section">
            <img src={logo} alt="Edustar Consult" className="hero-logo" />
            <div className="brand-text">
              <h1 className="hero-title">Edustar Consult</h1>
              <p className="hero-subtitle">Admin Dashboard</p>
              <p className="hero-tagline">From Ghana to the World — We Make Opportunities Happen.</p>
            </div>
          </div>
          <Link to="/" className="back-btn">
            <FaArrowLeft /> Back to Attendance
          </Link>
        </div>
      </div>

      <div className="forms-section">
        {!user && <AdminLogin />}
        {user && <AdminDashboard />}
      </div>
    </div>
  )
}