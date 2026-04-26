import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.jsx'

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="user">{auth.user ? auth.user.email : 'none'}</span>
      <button onClick={() => auth.login('a@b.c', 'pw')}>login</button>
      <button onClick={() => auth.register('a@b.c', 'pw', 'Alice')}>register</button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => auth.updateProfile({ display_name: 'New' })}>update</button>
    </div>
  )
}

function mockFetchOnce(body, ok = true) {
  globalThis.fetch = vi.fn(async () => ({
    ok,
    json: async () => body,
  }))
}

describe('AuthContext', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ user: null }) }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when useAuth is used outside provider', () => {
    expect(() => render(<Probe />)).toThrow(/AuthProvider/)
  })

  it('initializes by calling /api/auth/me and exposes loading=false after', async () => {
    mockFetchOnce({ user: { id: 1, email: 'a@b.c' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/me', expect.objectContaining({ credentials: 'include' }))
    expect(screen.getByTestId('user')).toHaveTextContent('a@b.c')
  })

  it('login() sets user on success', async () => {
    mockFetchOnce({ user: null }) // initial /me
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    mockFetchOnce({ user: { id: 1, email: 'a@b.c' } })
    await act(async () => {
      screen.getByText('login').click()
    })
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('a@b.c'))
  })

  it('login() throws on failure', async () => {
    mockFetchOnce({ user: null })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'))

    globalThis.fetch = vi.fn(async () => ({ ok: false, json: async () => ({ error: 'Bad creds' }) }))

    let caught
    function Catcher() {
      const auth = useAuth()
      return (
        <button onClick={async () => {
          try { await auth.login('a', 'b') } catch (e) { caught = e }
        }}>x</button>
      )
    }
    render(<AuthProvider><Catcher /></AuthProvider>)
    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    await act(async () => screen.getAllByText('x')[0].click())
    await waitFor(() => expect(caught?.message).toMatch(/Bad creds/))
  })

  it('logout() clears user', async () => {
    mockFetchOnce({ user: { id: 1, email: 'a@b.c' } })
    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('a@b.c'))

    globalThis.fetch = vi.fn(async () => ({ ok: true, json: async () => ({}) }))
    await act(async () => screen.getByText('logout').click())
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'))
  })
})
