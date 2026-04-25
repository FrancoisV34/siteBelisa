import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function PostsList() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    fetch('/api/admin/posts', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setPosts(d.posts))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const remove = async (id) => {
    if (!window.confirm('Supprimer définitivement cet article ?')) return
    const r = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) load()
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Articles</h1>
        <Link to="/admin/new" className="btn btn-primary">Nouvel article</Link>
      </header>
      {error && <p className="auth-error">{error}</p>}
      {posts === null && <p>Chargement…</p>}
      {posts && posts.length === 0 && <p>Aucun article.</p>}
      {posts && posts.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Auteur</th>
              <th>Statut</th>
              <th>Mis à jour</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.author_name}</td>
                <td>
                  <span className={`badge badge-${p.status}`}>{p.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                </td>
                <td>{fmt(p.updated_at)}</td>
                <td className="admin-actions">
                  {p.status === 'published' && <Link to={`/blog/${p.slug}`}>Voir</Link>}
                  <Link to={`/admin/posts/${p.id}`}>Éditer</Link>
                  <button type="button" onClick={() => remove(p.id)} className="link-btn link-btn-danger">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
