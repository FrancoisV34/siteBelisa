import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function fmt(ts) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Moderation() {
  const [comments, setComments] = useState(null)
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    fetch('/api/admin/comments', { credentials: 'include' })
      .then((r) => r.json()).then((d) => setComments(d.comments || []))
      .catch((e) => setError(e.message))
    fetch('/api/admin/guestbook', { credentials: 'include' })
      .then((r) => r.json()).then((d) => setEntries(d.entries || []))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const toggle = async (kind, id, current) => {
    const next = current === 'visible' ? 'hidden' : 'visible'
    const r = await fetch(`/api/admin/${kind}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    if (r.ok) load()
  }

  return (
    <div className="admin-page">
      <h1>Modération</h1>
      {error && <p className="auth-error">{error}</p>}

      <h2>Commentaires</h2>
      {comments === null && <p>Chargement…</p>}
      {comments && comments.length === 0 && <p>Aucun commentaire.</p>}
      {comments && comments.length > 0 && (
        <ul className="mod-list">
          {comments.map((c) => (
            <li key={c.id} className={`mod-item ${c.status === 'hidden' ? 'mod-hidden' : ''}`}>
              <p className="mod-content">{c.content}</p>
              <p className="mod-meta">
                par <strong>{c.display_name}</strong> sur <Link to={`/blog/${c.post_slug}`}>{c.post_title}</Link> · {fmt(c.created_at)}
              </p>
              <button type="button" className="link-btn" onClick={() => toggle('comments', c.id, c.status)}>
                {c.status === 'visible' ? 'Masquer' : 'Rendre visible'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ marginTop: '3rem' }}>Livre d'or</h2>
      {entries === null && <p>Chargement…</p>}
      {entries && entries.length === 0 && <p>Aucun message.</p>}
      {entries && entries.length > 0 && (
        <ul className="mod-list">
          {entries.map((e) => (
            <li key={e.id} className={`mod-item ${e.status === 'hidden' ? 'mod-hidden' : ''}`}>
              <p className="mod-content">{e.message}</p>
              <p className="mod-meta">par <strong>{e.display_name}</strong> · {fmt(e.created_at)}</p>
              <button type="button" className="link-btn" onClick={() => toggle('guestbook', e.id, e.status)}>
                {e.status === 'visible' ? 'Masquer' : 'Rendre visible'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
