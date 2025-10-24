import React from 'react'
import AttendanceForm from './components/AttendanceForm'
import CheckOutForm from './components/CheckOutForm'

import logo from '/logo.jpg'

export default function AttendancePage() {
  return (
    <div className="app-container">
      <div className="hero-section">
        <div className="hero-content">
          <div className="brand-section">
            <img src={logo} alt="Edustar Consult" className="hero-logo" />
            <div className="brand-text">
              <h1 className="hero-title">Edustar Consult</h1>
              <p className="hero-subtitle">Attendance System</p>
              <p className="hero-tagline">From Ghana to the World — We Make Opportunities Happen.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="forms-section">
        <div className="forms-container">
          <AttendanceForm />
          <CheckOutForm />
        </div>
      </div>
    </div>
  )
}