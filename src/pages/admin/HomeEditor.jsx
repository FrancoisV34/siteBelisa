import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react'

export default function HomeEditor() {
  const [hero, setHero] = useState({ title: '', subtitle: '' })
  const [savingHero, setSavingHero] = useState(false)
  const [sections, setSections] = useState([])
  const [stats, setStats] = useState([])
  const [error, setError] = useState(null)

  const loadAll = async () => {
    try {
      const [h, s, st] = await Promise.all([
        fetch('/api/admin/home/hero', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/admin/home/sections', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/admin/home/stats', { credentials: 'include' }).then((r) => r.json()),
      ])
      setHero({ title: h.title || '', subtitle: h.subtitle || '' })
      setSections(s.sections || [])
      setStats(st.stats || [])
    } catch (e) {
      setError(e.message)
    }
  }
  useEffect(() => { loadAll() }, [])

  const saveHero = async () => {
    setSavingHero(true)
    setError(null)
    try {
      const r = await fetch('/api/admin/home/hero', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(hero),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erreur')
    } catch (e) {
      setError(e.message)
    } finally {
      setSavingHero(false)
    }
  }

  // Sections
  const moveSection = async (id, dir) => {
    const idx = sections.findIndex((s) => s.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= sections.length) return
    const next = [...sections]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setSections(next)
    await fetch('/api/admin/home/sections/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: next.map((s, i) => ({ id: s.id, position: i })) }),
    })
  }

  const removeSection = async (id) => {
    if (!window.confirm('Supprimer cette section ?')) return
    const r = await fetch(`/api/admin/home/sections/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) loadAll()
  }

  // Stats
  const addStat = async () => {
    const r = await fetch('/api/admin/home/stats', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ number: '0', label: 'Nouveau' }),
    })
    if (r.ok) loadAll()
  }

  const updateStat = async (id, patch) => {
    const r = await fetch(`/api/admin/home/stats/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (r.ok) loadAll()
  }

  const removeStat = async (id) => {
    if (!window.confirm('Supprimer ce chiffre ?')) return
    const r = await fetch(`/api/admin/home/stats/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) loadAll()
  }

  const moveStat = async (id, dir) => {
    const idx = stats.findIndex((s) => s.id === id)
    const swap = idx + dir
    if (swap < 0 || swap >= stats.length) return
    const next = [...stats]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setStats(next)
    await fetch('/api/admin/home/stats/reorder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: next.map((s, i) => ({ id: s.id, position: i })) }),
    })
  }

  return (
    <div className="admin-page">
      <h1>Page d'accueil</h1>
      {error && <p className="auth-error">{error}</p>}

      {/* Hero */}
      <section className="admin-section">
        <h2>Hero (haut de page)</h2>
        <div className="admin-form">
          <label>
            <span>Titre</span>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => setHero({ ...hero, title: e.target.value })}
              maxLength={200}
            />
          </label>
          <label>
            <span>Sous-titre</span>
            <input
              type="text"
              value={hero.subtitle}
              onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
              maxLength={300}
            />
          </label>
          <button className="btn btn-primary" onClick={saveHero} disabled={savingHero}>
            {savingHero ? 'Enregistrement…' : 'Enregistrer le hero'}
          </button>
        </div>
      </section>

      {/* Sections */}
      <section className="admin-section">
        <div className="admin-page-header">
          <h2>Sections (À propos, etc.)</h2>
          <Link to="/admin/home/sections/new" className="btn btn-primary">
            <Plus size={16} /> <span>Nouvelle section</span>
          </Link>
        </div>
        {sections.length === 0 && <p>Aucune section.</p>}
        <ul className="admin-card-list">
          {sections.map((s, i) => (
            <li key={s.id} className="admin-card-row">
              <div className="admin-card-thumb">
                {s.image_url ? <img src={s.image_url} alt="" /> : <div className="placeholder-image">{s.title}</div>}
              </div>
              <div className="admin-card-body">
                <h3>{s.title}</h3>
                <span className={`badge badge-${s.status === 'visible' ? 'published' : 'draft'}`}>
                  {s.status === 'visible' ? 'Visible' : 'Masquée'}
                </span>
              </div>
              <div className="admin-card-actions">
                <button type="button" className="link-btn" onClick={() => moveSection(s.id, -1)} disabled={i === 0} aria-label="Monter">
                  <ArrowUp size={16} />
                </button>
                <button type="button" className="link-btn" onClick={() => moveSection(s.id, 1)} disabled={i === sections.length - 1} aria-label="Descendre">
                  <ArrowDown size={16} />
                </button>
                <Link to={`/admin/home/sections/${s.id}`}>Éditer</Link>
                <button type="button" className="link-btn link-btn-danger" onClick={() => removeSection(s.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Stats */}
      <section className="admin-section">
        <div className="admin-page-header">
          <h2>Chiffres</h2>
          <button className="btn btn-primary" onClick={addStat}>
            <Plus size={16} /> <span>Ajouter un chiffre</span>
          </button>
        </div>
        {stats.length === 0 && <p>Aucun chiffre.</p>}
        <ul className="admin-stats-list">
          {stats.map((s, i) => (
            <li key={s.id} className="admin-stat-row">
              <input
                type="text"
                value={s.number}
                onChange={(e) => setStats(stats.map((x) => x.id === s.id ? { ...x, number: e.target.value } : x))}
                onBlur={(e) => updateStat(s.id, { number: e.target.value })}
                placeholder="50+"
                style={{ width: '6rem' }}
              />
              <input
                type="text"
                value={s.label}
                onChange={(e) => setStats(stats.map((x) => x.id === s.id ? { ...x, label: e.target.value } : x))}
                onBlur={(e) => updateStat(s.id, { label: e.target.value })}
                placeholder="Œuvres réalisées"
                style={{ flex: 1 }}
              />
              <button type="button" className="link-btn" onClick={() => moveStat(s.id, -1)} disabled={i === 0} aria-label="Monter">
                <ArrowUp size={16} />
              </button>
              <button type="button" className="link-btn" onClick={() => moveStat(s.id, 1)} disabled={i === stats.length - 1} aria-label="Descendre">
                <ArrowDown size={16} />
              </button>
              <button type="button" className="link-btn link-btn-danger" onClick={() => removeStat(s.id)}>
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
