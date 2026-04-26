import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RequireRole from '../../src/components/RequireRole.jsx'

vi.mock('../../src/contexts/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

import { useAuth } from '../../src/contexts/AuthContext.jsx'

function renderAt(path = '/admin', roles = ['admin']) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/admin"
          element={
            <RequireRole roles={roles}>
              <div>Admin panel</div>
            </RequireRole>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('RequireRole', () => {
  beforeEach(() => vi.resetAllMocks())

  it('shows loading state', () => {
    useAuth.mockReturnValue({ user: null, loading: true })
    renderAt()
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument()
  })

  it('redirects to /login when no user', () => {
    useAuth.mockReturnValue({ user: null, loading: false })
    renderAt()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows "Accès refusé" when role insufficient', () => {
    useAuth.mockReturnValue({ user: { id: 1, role: 'user' }, loading: false })
    renderAt('/admin', ['admin'])
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument()
    expect(screen.queryByText('Admin panel')).not.toBeInTheDocument()
  })

  it('renders children when role matches', () => {
    useAuth.mockReturnValue({ user: { id: 1, role: 'admin' }, loading: false })
    renderAt('/admin', ['admin'])
    expect(screen.getByText('Admin panel')).toBeInTheDocument()
  })

  it('accepts any of multiple allowed roles', () => {
    useAuth.mockReturnValue({ user: { id: 1, role: 'editor' }, loading: false })
    renderAt('/admin', ['admin', 'editor'])
    expect(screen.getByText('Admin panel')).toBeInTheDocument()
  })
})
