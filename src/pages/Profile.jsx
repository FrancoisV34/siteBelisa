import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'
import Avatar from '../components/Avatar.jsx'

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
      </motion.div>
    </div>
  )
}
