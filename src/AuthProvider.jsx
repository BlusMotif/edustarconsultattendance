import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { getAuth, signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth'
import Swal from 'sweetalert2'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const timeoutRef = useRef(null)
  const warningRef = useRef(null)
  const SESSION_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds
  const WARNING_TIME = 1 * 60 * 1000 // Show warning 1 minute before logout

  // Reset timeout on user activity
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }
    if (user) {
      // Set warning timeout (4 minutes into the 5-minute session)
      warningRef.current = setTimeout(() => {
        showSessionWarning()
      }, SESSION_TIMEOUT - WARNING_TIME)

      // Set final logout timeout
      timeoutRef.current = setTimeout(() => {
        handleSignOut()
      }, SESSION_TIMEOUT)
    }
  }

  // Show session expiration warning
  const showSessionWarning = () => {
    Swal.fire({
      title: 'Session Expiring',
      text: 'Your session will expire in 1 minute due to inactivity. Do you want to stay logged in?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Stay Logged In',
      cancelButtonText: 'Logout Now',
      confirmButtonColor: '#7B1FA2',
      cancelButtonColor: '#6c757d',
      timer: 30000, // Auto-close after 30 seconds
      timerProgressBar: true,
      allowOutsideClick: false,
      allowEscapeKey: false
    }).then((result) => {
      if (result.isConfirmed) {
        // User wants to stay logged in, reset the timeout
        resetTimeout()
      } else {
        // User chose to logout or timer expired
        handleSignOut()
      }
    })
  }

  // Handle automatic sign out
  const handleSignOut = async () => {
    try {
      const auth = getAuth()
      await fbSignOut(auth)
    } catch (error) {
      console.error('Auto sign out error:', error)
    }
  }

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const handleActivity = () => {
      resetTimeout()
    }

    if (user) {
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true)
      })
      resetTimeout() // Start the timer
    }

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [user])

  useEffect(() => {
    const auth = getAuth()
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      if (!u) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (warningRef.current) {
          clearTimeout(warningRef.current)
        }
      }
    })
    return () => unsub()
  }, [])

  const signIn = (email, password) => {
    const auth = getAuth()
    return signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = (email, password) => {
    const auth = getAuth()
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const signOut = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }
    const auth = getAuth()
    return fbSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)