import React, { useEffect, useState } from 'react'
import { db, auth } from '../firebaseConfig'
import { ref, onValue, remove } from 'firebase/database'
import { updatePassword, signOut } from 'firebase/auth'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import Swal from 'sweetalert2'

function downloadCSV(filename, rows) {
  // Define column headers
  const headers = ['Full Name', 'Contact Number', 'Email Address', 'Role', 'Purpose of Visit', 'Check-in Date', 'Check-in Time', 'Check-out Time', 'Status']
  
  // Format data rows
  const dataRows = rows.map(r => [
    r.fullName || '',
    r.contact || '',
    r.email || '',
    r.role || '',
    r.purpose || '',
    r.date || '',
    r.timeIn ? new Date(r.timeIn).toLocaleString() : '',
    r.timeOut ? new Date(r.timeOut).toLocaleString() : '',
    r.status || ''
  ])
  
  // Combine all rows
  const allRows = [headers.join(','), ...dataRows.map(row => row.map(cell => `"${cell}"`).join(','))]
  const csvContent = allRows.join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

function exportExcel(filename, rows) {
  // Create workbook
  const wb = XLSX.utils.book_new()
  
  // Create data worksheet
  const dataHeaders = ['Full Name', 'Contact Number', 'Email Address', 'Role', 'Purpose of Visit', 'Check-in Date', 'Check-in Time', 'Check-out Time', 'Status']
  const dataRows = rows.map(r => [
    r.fullName || '',
    r.contact || '',
    r.email || '',
    r.role || '',
    r.purpose || '',
    r.date || '',
    r.timeIn ? new Date(r.timeIn).toLocaleString() : '',
    r.timeOut ? new Date(r.timeOut).toLocaleString() : '',
    r.status || ''
  ])
  
  const dataWs = XLSX.utils.aoa_to_sheet([dataHeaders, ...dataRows])
  
  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(wb, dataWs, 'Attendance Data')
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  saveAs(blob, filename)
}

function exportPDF(filename, rows) {
  const doc = new jsPDF('l', 'mm', 'a4') // Landscape orientation for better table fit

  // Add logo and title
  try {
    // Create an image element to load the logo
    const img = new Image()
    img.src = '/logo.jpg'

    // Draw the image on canvas when loaded with better quality
    img.onload = function() {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      // Use original image dimensions for better quality
      const maxLogoSize = 25 // mm in PDF, slightly smaller for centering
      const aspectRatio = img.width / img.height
      let logoWidth, logoHeight

      if (aspectRatio > 1) {
        logoWidth = maxLogoSize
        logoHeight = maxLogoSize / aspectRatio
      } else {
        logoHeight = maxLogoSize
        logoWidth = maxLogoSize * aspectRatio
      }

      canvas.width = img.width
      canvas.height = img.height

      // Enable image smoothing for better quality
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      ctx.drawImage(img, 0, 0, img.width, img.height)
      const logoData = canvas.toDataURL('image/png', 1.0) // Use PNG for better quality

      // Center the logo at the top, then stack text below it
      const pageWidth = 297
      const logoX = (pageWidth - logoWidth) / 2 // Center logo horizontally

      // Add logo to PDF centered at top
      doc.addImage(logoData, 'PNG', logoX, 10, logoWidth, logoHeight)

      // Add title centered below logo
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('Attendance Report', pageWidth / 2, 25 + logoHeight, { align: 'center' })

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 32 + logoHeight, { align: 'center' })
      doc.text(`Total Records: ${rows.length}`, pageWidth / 2, 39 + logoHeight, { align: 'center' })

      addTableToPDF(doc, rows)
      doc.save(filename)
    }

    // If image fails to load, continue without logo
    img.onerror = function() {
      addTitleWithoutLogo(doc, rows)
      addTableToPDF(doc, rows)
      doc.save(filename)
    }
  } catch (error) {
    // Fallback if image loading fails
    addTitleWithoutLogo(doc, rows)
    addTableToPDF(doc, rows)
    doc.save(filename)
  }
}

function addTitleWithoutLogo(doc, rows) {
  // Center the report title (A4 landscape = 297mm wide)
  // Position text lower to account for where logo would be
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Attendance Report', 148.5, 25, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 148.5, 32, { align: 'center' })
  doc.text(`Total Records: ${rows.length}`, 148.5, 39, { align: 'center' })
}

function addTableToPDF(doc, rows) {
  // Define column widths for landscape A4 (297mm width) - adjusted to fit within margins
  const colWidths = [32, 25, 40, 18, 32, 22, 38, 38, 18] // Total: ~263mm (fits within page)
  const headers = ['Full Name', 'Contact', 'Email', 'Role', 'Purpose', 'Date', 'Check-in Time', 'Check-out Time', 'Status']

  let y = 55 // Start lower to accommodate stacked header (logo + text below)
  const rowHeight = 10 // Slightly reduced for more rows per page
  const pageHeight = 180 // A4 landscape height minus margins
  const tableStartX = 17 // Center the table on the page

  // Draw table header
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setFillColor(123, 31, 162) // EduStar purple
  doc.rect(tableStartX, y - 3, 263, rowHeight, 'F') // Table width matches colWidths sum
  doc.setTextColor(255, 255, 255)

  let x = tableStartX
  headers.forEach((header, index) => {
    doc.text(header, x + 2, y + 2)
    x += colWidths[index]
  })

  y += rowHeight
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(0, 0, 0)

  // Add data rows
  rows.forEach((r, rowIndex) => {
    if (y + rowHeight > pageHeight) {
      doc.addPage()
      y = 20

      // Redraw header on new page
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setFillColor(123, 31, 162)
      doc.rect(tableStartX, y - 3, 263, rowHeight, 'F')
      doc.setTextColor(255, 255, 255)

      x = tableStartX
      headers.forEach((header, index) => {
        doc.text(header, x + 2, y + 2)
        x += colWidths[index]
      })

      y += rowHeight
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
    }

    // Alternate row colors
    if (rowIndex % 2 === 0) {
      doc.setFillColor(245, 247, 250)
      doc.rect(tableStartX, y - 3, 263, rowHeight, 'F')
    }

    const rowData = [
      r.fullName || '',
      r.contact || '',
      r.email || '',
      r.role || '',
      r.purpose || '',
      r.date || '',
      r.timeIn ? new Date(r.timeIn).toLocaleString() : '',
      r.timeOut ? new Date(r.timeOut).toLocaleString() : '',
      r.status || ''
    ]

    x = tableStartX
    rowData.forEach((cell, index) => {
      const maxWidth = colWidths[index] - 4 // Padding
      const cellText = cell.length > 40 ? cell.substring(0, 37) + '...' : cell
      const lines = doc.splitTextToSize(cellText, maxWidth)

      // Handle multi-line text
      if (Array.isArray(lines)) {
        lines.forEach((line, lineIndex) => {
          if (y + (lineIndex * 3) + 2 < y + rowHeight) {
            doc.text(line, x + 2, y + 2 + (lineIndex * 3))
          }
        })
      } else {
        doc.text(lines, x + 2, y + 2)
      }

      x += colWidths[index]
    })

    y += rowHeight
  })
}

export default function AdminDashboard() {
  const [records, setRecords] = useState([])
  const [filters, setFilters] = useState({ date: '', role: 'All', status: 'All' })

  useEffect(() => {
    const attendanceRef = ref(db, 'attendance')
    const unsub = onValue(attendanceRef, (snap) => {
      const v = snap.val() || {}
      const arr = Object.keys(v).map((k) => ({ id: k, ...v[k] }))
      // sort by timeIn desc
      arr.sort((a,b) => (b.timeIn || '').localeCompare(a.timeIn || ''))
      setRecords(arr)
    })
    return () => unsub()
  }, [])

  const filtered = records.filter((r) => {
    if (filters.date && r.date !== filters.date) return false
    if (filters.role !== 'All' && r.role !== filters.role) return false
    if (filters.status !== 'All' && r.status !== filters.status) return false
    return true
  })

  const currentlyCheckedIn = records.filter(r => r.status === 'checkedIn')

  const doExport = () => {
    if (!filtered.length) return alert('No records to export')
    downloadCSV('attendance.csv', filtered)
  }

  const doExportExcel = () => {
    if (!filtered.length) return alert('No records to export')
    exportExcel('attendance.xlsx', filtered)
  }

  const doExportPDF = () => {
    if (!filtered.length) return alert('No records to export')
    exportPDF('attendance.pdf', filtered)
  }

  const doPrint = () => {
    const w = window.open('', '_blank')
    const printDate = new Date().toLocaleString()
    
    const rows = filtered.map(r => `
      <tr>
        <td>${r.fullName || ''}</td>
        <td>${r.contact || ''}</td>
        <td>${r.email || ''}</td>
        <td>${r.role || ''}</td>
        <td>${r.purpose || ''}</td>
        <td>${r.date || ''}</td>
        <td>${r.timeIn ? new Date(r.timeIn).toLocaleString() : ''}</td>
        <td>${r.timeOut ? new Date(r.timeOut).toLocaleString() : ''}</td>
        <td>${r.status || ''}</td>
      </tr>
    `).join('')
    
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #7B1FA2;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 10px;
            }
            .logo {
              max-width: 80px;
              height: auto;
              object-fit: contain;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
            .header-content {
              text-align: center;
              min-width: 200px;
            }
            .report-title {
              font-size: 24px;
              font-weight: bold;
              color: #7B1FA2;
              margin: 5px 0;
            }
            .report-subtitle {
              font-size: 12px;
              color: #666;
              margin: 2px 0;
            }
            .report-info {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-left: 4px solid #7B1FA2;
              display: none;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 10px;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 6px 3px;
              text-align: left;
              word-wrap: break-word;
              overflow-wrap: break-word;
              hyphens: auto;
            }
            th {
              background: linear-gradient(135deg, #7B1FA2, #9C27B0);
              color: white;
              font-weight: bold;
              position: sticky;
              top: 0;
              font-size: 9px;
            }
            tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            tr:hover {
              background-color: #e8f4fd;
            }
            .status-checkedIn {
              background-color: #d4edda;
              color: #155724;
              padding: 2px 6px;
              border-radius: 3px;
              font-weight: bold;
            }
            .status-checkedOut {
              background-color: #f8d7da;
              color: #721c24;
              padding: 2px 6px;
              border-radius: 3px;
              font-weight: bold;
            }
            @media print {
              body { margin: 10mm; }
              .no-print { display: none; }
              table { font-size: 8px; }
              th, td { padding: 4px 2px; }
              .logo { max-width: 60px; }
              .report-title { font-size: 18px; }
              .report-subtitle { font-size: 10px; }
              .header { gap: 5px; flex-direction: column; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.jpg" alt="Logo" class="logo" />
            <div class="header-content">
              <div class="report-title">Attendance Report</div>
              <div class="report-subtitle">Generated on: ${printDate}</div>
              <div class="report-subtitle">Total Records: ${filtered.length}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Contact Number</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Purpose of Visit</th>
                <th>Check-in Date</th>
                <th>Check-in Time</th>
                <th>Check-out Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            }
          </script>
        </body>
      </html>
    `)
    w.document.close()
  }

  const handleClearAllRecords = async () => {
    const result = await Swal.fire({
      title: 'Clear All Records?',
      text: 'This action will permanently delete ALL attendance records. This cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Clear All',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true
    })

    if (result.isConfirmed) {
      try {
        const attendanceRef = ref(db, 'attendance')
        await remove(attendanceRef)
        
        await Swal.fire({
          title: 'Records Cleared!',
          text: 'All attendance records have been successfully deleted.',
          icon: 'success',
          confirmButtonColor: '#7B1FA2'
        })
      } catch (error) {
        console.error('Error clearing records:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Failed to clear records. Please try again.',
          icon: 'error',
          confirmButtonColor: '#7B1FA2'
        })
      }
    }
  }

  const handlePasswordChange = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Change Admin Password',
      html:
        '<input id="current-password" type="password" placeholder="Current Password" class="swal2-input" style="margin-bottom: 10px;">' +
        '<input id="new-password" type="password" placeholder="New Password" class="swal2-input" style="margin-bottom: 10px;">' +
        '<input id="confirm-password" type="password" placeholder="Confirm New Password" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Change Password',
      confirmButtonColor: '#7B1FA2',
      preConfirm: () => {
        const currentPassword = document.getElementById('current-password').value
        const newPassword = document.getElementById('new-password').value
        const confirmPassword = document.getElementById('confirm-password').value
        
        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('All fields are required')
          return false
        }
        
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('New passwords do not match')
          return false
        }
        
        if (newPassword.length < 6) {
          Swal.showValidationMessage('New password must be at least 6 characters')
          return false
        }
        
        return { currentPassword, newPassword }
      }
    })

    if (formValues) {
      try {
        const user = auth.currentUser
        if (!user) {
          throw new Error('No user is currently logged in')
        }

        // Update the password using Firebase Auth
        await updatePassword(user, formValues.newPassword)
        
        await Swal.fire({
          title: 'Success!',
          text: 'Password changed successfully. You will be logged out for security.',
          icon: 'success',
          confirmButtonColor: '#7B1FA2'
        })

        // Log out the user after password change for security
        await signOut(auth)
        
      } catch (error) {
        console.error('Password change error:', error)
        let errorMessage = 'Failed to change password. Please try again.'
        
        if (error.code === 'auth/requires-recent-login') {
          errorMessage = 'For security reasons, please log out and log back in before changing your password.'
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.'
        }
        
        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonColor: '#7B1FA2'
        })
      }
    }
  }

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7B1FA2',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, Logout'
    })

    if (result.isConfirmed) {
      try {
        await signOut(auth)
        Swal.fire({
          title: 'Logged Out',
          text: 'You have been successfully logged out.',
          icon: 'success',
          confirmButtonColor: '#7B1FA2'
        })
      } catch (error) {
        console.error('Logout error:', error)
        Swal.fire({
          title: 'Error!',
          text: 'Failed to logout. Please try again.',
          icon: 'error',
          confirmButtonColor: '#7B1FA2'
        })
      }
    }
  }

  return (
    <div className="admin-dashboard-full">
      <div className="admin-content">
        <div className="filters-section">
          <div className="filters">
            <div className="filter-group">
              <label>Date</label>
              <input type="date" value={filters.date} onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="filter-group">
              <label>Role</label>
              <select value={filters.role} onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}>
                <option>All</option>
                <option>Visitor</option>
                <option>Staff</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
                <option>All</option>
                <option value="checkedIn">Checked In</option>
                <option value="checkedOut">Checked Out</option>
              </select>
            </div>
          </div>

          <div className="actions">
            <button onClick={handlePasswordChange} className="secondary">Change Password</button>
            <button onClick={handleLogout} className="secondary">Logout</button>
            <button onClick={doExport} className="primary">Export CSV</button>
            <button onClick={doExportExcel} className="primary">Export Excel</button>
            <button onClick={doExportPDF} className="primary">Export PDF</button>
            <button onClick={doPrint} className="secondary">Print Report</button>
            <button onClick={handleClearAllRecords} className="danger">Clear All Records</button>
          </div>
        </div>

        <div className="summary-section">
          <div className="summary">
            <strong>Currently Checked In: </strong> {currentlyCheckedIn.length}
          </div>
          <div className="summary">
            <strong>Total Records: </strong> {filtered.length}
          </div>
        </div>

        <div className="table-container">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Contact Number</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Purpose of Visit</th>
                  <th>Check-in Date</th>
                  <th>Check-in Time</th>
                  <th>Check-out Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className={r.status === 'checkedIn' ? 'active' : ''}>
                    <td>{r.fullName}</td>
                    <td>{r.contact || '-'}</td>
                    <td>{r.email || '-'}</td>
                    <td>{r.role}</td>
                    <td>{r.purpose || '-'}</td>
                    <td>{r.date}</td>
                    <td>{r.timeIn ? new Date(r.timeIn).toLocaleString() : '-'}</td>
                    <td>{r.timeOut ? new Date(r.timeOut).toLocaleString() : '-'}</td>
                    <td>{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}