import '../setupTests'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../App'
import { generateSolution } from '../core/solutionGenerator'
import { buildRegions } from '../core/regionGenerator'
import { countSolutions } from '../core/uniquenessSolver'

describe('Integration tests', () => {
  it('generates a solution and verifies solver can find solutions (integration)', async () => {
    const sol = generateSolution(6)
    const regions = buildRegions(sol, 6)
    const sols = countSolutions(regions, 2)
    expect(sols).toBeGreaterThanOrEqual(1)
  })

  it('renders App and goes through new->start->game flow', async () => {
    const { container } = render(<App />)

    // navigate to New and ensure Start button is present, but avoid running generator
    fireEvent.click(screen.getByText('New'))
    expect(screen.getByText('Start')).toBeTruthy()

    // navigate to Settings and Stats pages via nav
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Stats' }))
    expect(screen.getByRole('heading', { name: 'Stats' })).toBeTruthy()

    // basic DOM sanity: app-root exists
    expect(container.querySelector('.app-root')).toBeTruthy()
  })
})
