import React, { useState } from 'react'
import { db } from '../firebaseConfig'
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database'
import Swal from 'sweetalert2'
import { FaUser, FaSignOutAlt } from 'react-icons/fa'

export default function CheckOutForm() {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCheckOut = async (e) => {
    e.preventDefault()
    if (!fullName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Please enter the full name to check out',
        timer: 2000,
        showConfirmButton: false
      })
      return
    }
    setLoading(true)
    try {
      const q = query(ref(db, 'attendance'), orderByChild('fullName'), equalTo(fullName.trim()))
      const snapshot = await get(q)
      if (!snapshot.exists()) {
        setLoading(false)
        Swal.fire({
          icon: 'error',
          title: 'Not Found',
          text: 'No active record found for that name',
          timer: 3000,
          showConfirmButton: false
        })
        return
      }

      const val = snapshot.val()
      // Find an active checkedIn record (take the most recent timeIn if multiple)
      let activeKey = null
      let activeRecord = null
      Object.keys(val).forEach((k) => {
        const r = val[k]
        if (r.status === 'checkedIn') {
          if (!activeRecord) {
            activeKey = k
            activeRecord = r
          } else {
            if (r.timeIn && activeRecord.timeIn && r.timeIn > activeRecord.timeIn) {
              activeKey = k
              activeRecord = r
            }
          }
        }
      })

      if (!activeKey) {
        setLoading(false)
        Swal.fire({
          icon: 'warning',
          title: 'Not Checked In',
          text: 'No currently checked-in record found for that name',
          timer: 3000,
          showConfirmButton: false
        })
        return
      }

      const now = new Date().toISOString()
      await update(ref(db, `attendance/${activeKey}`), {
        status: 'checkedOut',
        timeOut: now
      })

      setFullName('')
      Swal.fire({
        icon: 'success',
        title: 'Checked Out Successfully!',
        text: `Goodbye, ${fullName}!`,
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Checkout Failed',
        text: 'Please try again or contact support.',
        timer: 3000,
        showConfirmButton: false
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card checkout-form animate-fade-in" onSubmit={handleCheckOut}>
      <h3><FaSignOutAlt /> Check Out</h3>
      <div className="input-group">
        <FaUser />
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />
      </div>
      <button type="submit" className="secondary animate-bounce" disabled={loading}>{loading ? 'Processing...' : 'Check Out'}</button>
    </form>
  )
}