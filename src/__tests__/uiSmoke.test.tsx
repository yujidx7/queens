import '../setupTests'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../App'

describe('UI smoke', () => {
  it('renders main app and shows header', () => {
    render(<App />)
    expect(screen.getByText('Queens')).toBeTruthy()
  })
})
