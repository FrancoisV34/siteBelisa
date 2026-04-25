import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RichEditor from '../../components/RichEditor.jsx'
import ImageUpload from '../../components/ImageUpload.jsx'

export default function HomeSectionEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('visible')

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/home/sections/${id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => {
        setTitle(d.section.title)
        setBodyHtml(d.section.body_html)
        setImageUrl(d.section.image_url || '')
        setStatus(d.section.status)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = { title, body_html: bodyHtml, image_url: imageUrl, status }
      const r = await fetch(isNew ? '/api/admin/home/sections' : `/api/admin/home/sections/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erreur')
      navigate('/admin/home')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Supprimer cette section ?')) return
    await fetch(`/api/admin/home/sections/${id}`, { method: 'DELETE', credentials: 'include' })
    navigate('/admin/home')
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{isNew ? 'Nouvelle section' : 'Éditer la section'}</h1>
        <div className="admin-page-actions">
          {!isNew && <button className="btn btn-secondary" onClick={remove}>Supprimer</button>}
          <button className="btn btn-secondary" onClick={() => navigate('/admin/home')}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !title}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>
      {error && <p className="auth-error">{error}</p>}

      <div className="admin-form">
        <label>
          <span>Titre</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>
        <ImageUpload value={imageUrl} onChange={setImageUrl} label="Image (optionnelle)" />
        <label>
          <span>Statut</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="visible">Visible</option>
            <option value="hidden">Masquée</option>
          </select>
        </label>
        <label>
          <span>Contenu</span>
          <RichEditor value={bodyHtml} onChange={setBodyHtml} />
        </label>
      </div>
    </div>
  )
}
