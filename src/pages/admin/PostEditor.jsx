import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RichEditor from '../../components/RichEditor.jsx'

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/posts/${id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => {
        setTitle(d.post.title)
        setExcerpt(d.post.excerpt || '')
        setCoverImage(d.post.cover_image || '')
        setContentHtml(d.post.content_html)
        setStatus(d.post.status)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const save = async (newStatus) => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title, excerpt, cover_image: coverImage,
        content_html: contentHtml,
        status: newStatus ?? status,
      }
      const r = await fetch(isNew ? '/api/admin/posts' : `/api/admin/posts/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      if (isNew) navigate(`/admin/posts/${data.post.id}`, { replace: true })
      else setStatus(data.post.status)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{isNew ? 'Nouvel article' : 'Éditer l\'article'}</h1>
        <div className="admin-page-actions">
          <button className="btn btn-secondary" onClick={() => save('draft')} disabled={saving}>
            Enregistrer brouillon
          </button>
          <button className="btn btn-primary" onClick={() => save('published')} disabled={saving || !title || !contentHtml}>
            {status === 'published' ? 'Mettre à jour' : 'Publier'}
          </button>
        </div>
      </header>
      {error && <p className="auth-error">{error}</p>}

      <div className="admin-form">
        <label>
          <span>Titre</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </label>
        <label>
          <span>Image de couverture (URL)</span>
          <input type="url" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://…" />
        </label>
        <label>
          <span>Extrait (max 300 caractères)</span>
          <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={300} rows={2} />
        </label>
        <label>
          <span>Contenu</span>
          <RichEditor value={contentHtml} onChange={setContentHtml} />
        </label>
      </div>
    </div>
  )
}
