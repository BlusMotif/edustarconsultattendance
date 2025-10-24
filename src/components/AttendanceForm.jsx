import React, { useState } from 'react'
import { db } from '../firebaseConfig'
import { ref, push, set, query, orderByChild, equalTo, get } from 'firebase/database'
import Swal from 'sweetalert2'
import { FaUser, FaPhone, FaEnvelope, FaBriefcase, FaMapMarkerAlt, FaCheck } from 'react-icons/fa'

export default function AttendanceForm() {
  const [fullName, setFullName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Visitor')
  const [purpose, setPurpose] = useState('')
  const [loading, setLoading] = useState(false)

  const clear = () => {
    setFullName('')
    setContact('')
    setEmail('')
    setRole('Visitor')
    setPurpose('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please enter your full name',
        timer: 2000,
        showConfirmButton: false
      })
      return
    }
    setLoading(true)

    try {
      // Prevent duplicate check-ins: find if there's an active record for this name
      const q = query(ref(db, 'attendance'), orderByChild('fullName'), equalTo(fullName.trim()))
      const snapshot = await get(q)
      let hasActive = false
      if (snapshot && snapshot.exists()) {
        const val = snapshot.val()
        Object.keys(val).forEach((k) => {
          if (val[k].status === 'checkedIn') hasActive = true
        })
      }

      if (hasActive) {
        setLoading(false)
        Swal.fire({
          icon: 'warning',
          title: 'Already Checked In',
          text: 'This person is already checked in. They must check out before checking in again.',
          timer: 3000,
          showConfirmButton: false
        })
        return
      }

      const now = new Date().toISOString()
      const dateOnly = now.split('T')[0]
      const recordRef = push(ref(db, 'attendance'))
      await set(recordRef, {
        fullName: fullName.trim(),
        contact: contact.trim() || null,
        email: email.trim() || null,
        role,
        purpose: role === 'Visitor' ? (purpose.trim() || null) : null,
        timeIn: now,
        timeOut: null,
        status: 'checkedIn',
        date: dateOnly
      })

      clear()
      Swal.fire({
        icon: 'success',
        title: 'Checked In Successfully!',
        text: `Welcome, ${fullName}!`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Check-in Failed',
        text: 'Please try again or contact support.',
        timer: 3000,
        showConfirmButton: false
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card attendance-form animate-fade-in" onSubmit={handleSubmit}>
      <h3><FaCheck /> Check In</h3>
      <div className="input-group">
        <FaUser />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />
      </div>

      <div className="input-group">
        <FaPhone />
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone" />
      </div>

      <div className="input-group">
        <FaEnvelope />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      </div>

      <div className="input-group">
        <FaBriefcase />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option>Visitor</option>
          <option>Staff</option>
        </select>
      </div>

      {role === 'Visitor' && (
        <div className="input-group animate-slide-down">
          <FaMapMarkerAlt />
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose of Visit" />
        </div>
      )}

      <button type="submit" className="primary animate-bounce" disabled={loading}>
        {loading ? 'Checking...' : 'Check In'}
      </button>
    </form>
  )
}