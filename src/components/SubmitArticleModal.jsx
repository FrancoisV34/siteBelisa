import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import RichEditor from './RichEditor.jsx'
import ImageUpload from './ImageUpload.jsx'

export default function SubmitArticleModal({ mode = 'create', postId = null, onClose, onSuccess }) {
  const isEdit = mode === 'edit' && postId != null

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [contentHtml, setContentHtml] = useState('')

  useEffect(() => {
    if (!isEdit) return
    fetch(`/api/posts/mine/${postId}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => {
        setTitle(d.post.title)
        setExcerpt(d.post.excerpt || '')
        setCoverImage(d.post.cover_image || '')
        setContentHtml(d.post.content_html || '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [isEdit, postId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = async (e) => {
    e?.preventDefault()
    setError(null)
    if (!title.trim()) return setError('Un titre est requis.')
    if (!contentHtml.trim()) return setError('Le contenu ne peut pas être vide.')
    setSaving(true)
    try {
      const payload = {
        title,
        excerpt: excerpt || undefined,
        cover_image: coverImage || undefined,
        content_html: contentHtml,
      }
      const url = isEdit ? `/api/posts/mine/${postId}` : '/api/posts/submit'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur lors de l\'envoi')
      if (onSuccess) onSuccess(data.post)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEdit ? 'Modifier ma proposition' : 'Proposer un article'}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <p className="modal-loading">Chargement…</p>
        ) : (
          <form className="modal-body admin-form" onSubmit={submit}>
            <p className="modal-hint">
              Votre proposition sera relue par l'administratrice avant publication.
            </p>

            <label>
              <span>Titre</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
                autoFocus
              />
            </label>

            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              label="Image de couverture (optionnelle)"
            />

            <label>
              <span>Extrait (max 300 caractères, optionnel)</span>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={300}
                rows={2}
              />
            </label>

            <label>
              <span>Contenu</span>
              <RichEditor value={contentHtml} onChange={setContentHtml} />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <footer className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || !title.trim() || !contentHtml.trim()}
              >
                {saving ? 'Envoi…' : isEdit ? 'Enregistrer' : 'Envoyer pour relecture'}
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>
  )
}
