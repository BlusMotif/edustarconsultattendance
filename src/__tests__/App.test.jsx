import React from 'react'
import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders header title', () => {
  render(<App />)
  const title = screen.getByText(/Edustar Consult Attendance System/i)
  expect(title).toBeTruthy()
})