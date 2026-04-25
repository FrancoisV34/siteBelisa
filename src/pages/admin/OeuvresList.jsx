import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown, Plus, Trash2 } from 'lucide-react'

export default function OeuvresList() {
  const [oeuvres, setOeuvres] = useState(null)
  const [error, setError] = useState(null)

  const load = () => {
    fetch('/api/admin/oeuvres', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setOeuvres(d.oeuvres))
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  const remove = async (id) => {
    if (!window.confirm("Supprimer cette œuvre ?")) return
    const r = await fetch(`/api/admin/oeuvres/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) load()
  }

  const move = async (id, dir) => {
    if (!oeuvres) return
    const idx = oeuvres.findIndex((o) => o.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= oeuvres.length) return
    const next = [...oeuvres]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setOeuvres(next)
    await fetch('/api/admin/oeuvres/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: next.map((o, i) => ({ id: o.id, position: i })) }),
    })
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Œuvres</h1>
        <Link to="/admin/oeuvres/new" className="btn btn-primary">
          <Plus size={16} /> <span>Nouvelle œuvre</span>
        </Link>
      </header>
      {error && <p className="auth-error">{error}</p>}
      {oeuvres === null && <p>Chargement…</p>}
      {oeuvres && oeuvres.length === 0 && <p>Aucune œuvre. Crée la première !</p>}
      {oeuvres && oeuvres.length > 0 && (
        <ul className="admin-card-list">
          {oeuvres.map((o, i) => (
            <li key={o.id} className="admin-card-row">
              <div className="admin-card-thumb">
                {o.image_url ? <img src={o.image_url} alt="" /> : <div className="placeholder-image">{o.title}</div>}
              </div>
              <div className="admin-card-body">
                <h3>{o.title}</h3>
                <p className="admin-card-meta">
                  {[o.year, o.technique, o.dimensions].filter(Boolean).join(' — ')}
                </p>
                <span className={`badge badge-${o.status === 'visible' ? 'published' : 'draft'}`}>
                  {o.status === 'visible' ? 'Visible' : 'Masquée'}
                </span>
              </div>
              <div className="admin-card-actions">
                <button type="button" className="link-btn" onClick={() => move(o.id, -1)} disabled={i === 0} aria-label="Monter">
                  <ArrowUp size={16} />
                </button>
                <button type="button" className="link-btn" onClick={() => move(o.id, 1)} disabled={i === oeuvres.length - 1} aria-label="Descendre">
                  <ArrowDown size={16} />
                </button>
                <Link to={`/admin/oeuvres/${o.id}`}>Éditer</Link>
                <button type="button" className="link-btn link-btn-danger" onClick={() => remove(o.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
