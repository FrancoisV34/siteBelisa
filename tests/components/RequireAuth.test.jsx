import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RequireAuth from '../../src/components/RequireAuth.jsx'

vi.mock('../../src/contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../src/contexts/AuthContext.jsx'

function renderAt(path = '/protected') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>Secret content</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireAuth', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows loading state', () => {
    useAuth.mockReturnValue({ user: null, loading: true })
    renderAt()
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()
  })

  it('redirects to /login when not authenticated', () => {
    useAuth.mockReturnValue({ user: null, loading: false })
    renderAt()
    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    useAuth.mockReturnValue({ user: { id: 1, role: 'user' }, loading: false })
    renderAt()
    expect(screen.getByText('Secret content')).toBeInTheDocument()
  })
})
