import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'
import SubmitArticleModal from '../components/SubmitArticleModal.jsx'

const STATUS_LABELS = {
  pending: 'En attente',
  published: 'Publié',
  draft: 'Brouillon',
}

const ROLE_LABELS = { admin: 'Administrateur', author: 'Auteur', user: 'Membre' }

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  const [submissions, setSubmissions] = useState(null)
  const [submissionsError, setSubmissionsError] = useState(null)
  const [editingId, setEditingId] = useState(null)

  const reloadSubmissions = () => {
    fetch('/api/posts/mine', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setSubmissions(d.posts || []))
      .catch((e) => setSubmissionsError(e.message))
  }

  useEffect(() => {
    if (user) reloadSubmissions()
  }, [user])

  const withdraw = async (id) => {
    if (!window.confirm('Retirer cette proposition ? Cette action est définitive.')) return
    const r = await fetch(`/api/posts/mine/${id}`, { method: 'DELETE', credentials: 'include' })
    if (r.ok) {
      setSubmissions((prev) => prev.filter((p) => p.id !== id))
    } else {
      const data = await r.json().catch(() => ({}))
      alert(data.error || 'Erreur lors du retrait')
    }
  }

  if (!user) return null

  const dirty = displayName.trim() !== user.display_name && displayName.trim().length >= 2

  const save = async (e) => {
    e.preventDefault()
    if (!dirty) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await updateProfile({ display_name: displayName.trim() })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page profile-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="profile-card"
      >
        <div className="profile-header">
          <Avatar displayName={user.display_name} size={64} />
          <div>
            <h1>{user.display_name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <dl className="profile-meta">
          <div>
            <dt>Rôle</dt>
            <dd><span className={`badge badge-${user.role === 'admin' ? 'published' : 'draft'}`}>{ROLE_LABELS[user.role] || user.role}</span></dd>
          </div>
          <div>
            <dt>Membre depuis</dt>
            <dd>{formatDate(user.created_at)}</dd>
          </div>
        </dl>

        <form className="profile-form" onSubmit={save}>
          <h2>Modifier mon profil</h2>
          {error && <p className="auth-error">{error}</p>}
          {saved && <p className="auth-success">Modifications enregistrées.</p>}
          <label>
            <span>Nom affiché</span>
            <input
              type="text"
              value={displayName}
              onChange={(e) => { setDisplayName(e.target.value); setSaved(false) }}
              minLength={2}
              maxLength={60}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>

        <section className="profile-submissions">
          <h2>Mes propositions d'articles</h2>
          {submissionsError && <p className="auth-error">{submissionsError}</p>}
          {submissions === null && !submissionsError && <p>Chargement…</p>}
          {submissions && submissions.length === 0 && (
            <p style={{ color: '#6e6e73' }}>Vous n'avez pas encore proposé d'article.</p>
          )}
          {submissions && submissions.length > 0 && (
            <div className="submissions-list">
              {submissions.map((p) => (
                <div key={p.id} className="submission-row">
                  <div className="submission-title" title={p.title}>{p.title}</div>
                  <span className={`submission-status is-${p.status}`}>
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                  <span style={{ color: '#6e6e73', fontSize: '0.85rem' }}>
                    {formatDate(p.updated_at)}
                  </span>
                  <div className="submission-actions">
                    {p.status === 'pending' && (
                      <>
                        <button className="btn btn-secondary" onClick={() => setEditingId(p.id)}>
                          Éditer
                        </button>
                        <button className="btn btn-secondary" onClick={() => withdraw(p.id)}>
                          Retirer
                        </button>
                      </>
                    )}
                    {p.status === 'published' && (
                      <Link className="btn btn-secondary" to={`/blog/${p.slug}`}>Voir</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </motion.div>

      {editingId != null && (
        <SubmitArticleModal
          mode="edit"
          postId={editingId}
          onClose={() => setEditingId(null)}
          onSuccess={() => reloadSubmissions()}
        />
      )}
    </div>
  )
}
