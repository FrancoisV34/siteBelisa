import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

export default function Users() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setUsers(d.users))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const update = async (id, patch) => {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (r.ok) load()
    else {
      const d = await r.json().catch(() => ({}))
      setError(d.error || 'Erreur')
    }
  }

  return (
    <div className="admin-page">
      <h1>Utilisateurs</h1>
      {error && <p className="auth-error">{error}</p>}
      {users === null && <p>Chargement…</p>}
      {users && (
        <table className="admin-table">
          <thead>
            <tr><th>Email</th><th>Nom</th><th>Rôle</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={u.status === 'banned' ? 'row-banned' : ''}>
                <td>{u.email}</td>
                <td>{u.display_name}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={u.id === me.id}
                    onChange={(e) => update(u.id, { role: e.target.value })}
                  >
                    <option value="user">user</option>
                    <option value="author">author</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.status === 'banned' ? 'Banni' : 'Actif'}</td>
                <td className="admin-actions">
                  {u.id !== me.id && (
                    u.status === 'banned'
                      ? <button className="link-btn" onClick={() => update(u.id, { status: 'active' })}>Réactiver</button>
                      : <button className="link-btn link-btn-danger" onClick={() => update(u.id, { status: 'banned' })}>Bannir</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
