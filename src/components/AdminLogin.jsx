import React, { useState } from 'react'
import { useAuth } from '../AuthProvider'
import Swal from 'sweetalert2'
import { FaUserShield, FaEnvelope, FaLock, FaSignInAlt, FaSignOutAlt } from 'react-icons/fa'

export default function AdminLogin() {
  const { user, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const doSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(email, password)
      Swal.fire({
        icon: 'success',
        title: 'Welcome Admin!',
        text: 'You are now logged in.',
        timer: 2000,
        showConfirmButton: false
      })
    } catch (err) {
      console.error(err)
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: 'Invalid credentials or create an admin account first.',
        timer: 3000,
        showConfirmButton: false
      })
    } finally { setLoading(false) }
  }

  if (user) {
    return (
      <div className="card admin-status animate-fade-in">
        <h3><FaUserShield /> Admin Panel</h3>
        <div className="user-info">
          <FaUserShield className="user-icon" />
          <span>Signed in as {user.email}</span>
        </div>
        <button className="secondary animate-bounce" onClick={() => {
          signOut()
          Swal.fire({
            icon: 'info',
            title: 'Signed Out',
            text: 'You have been logged out.',
            timer: 1500,
            showConfirmButton: false
          })
        }}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    )
  }

  return (
    <form className="card login-form animate-fade-in" onSubmit={doSignIn}>
      <h3><FaUserShield /> Admin Login</h3>
      <div className="input-group">
        <FaEnvelope />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="admin@domain.com" required />
      </div>
      <div className="input-group">
        <FaLock />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password" required />
      </div>
      <div className="button-group">
        <button type="submit" className="primary animate-bounce" disabled={loading}>
          <FaSignInAlt /> {loading? 'Signing...':'Sign In'}
        </button>
      </div>
      <small className="hint">Contact your administrator to get login credentials.</small>
    </form>
  )
}