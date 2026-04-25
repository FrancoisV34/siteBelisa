import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext.jsx'

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Guestbook() {
  const { user } = useAuth()
  const [entries, setEntries] = useState(null)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/guestbook')
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(() => setEntries([]))
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/guestbook', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      setEntries((prev) => [data.entry, ...(prev || [])])
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page guestbook-page">
      <section className="blog-hero">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Livre d'or
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Laissez un mot, partagez vos impressions.
        </motion.p>
      </section>

      {user ? (
        <form className="guestbook-form" onSubmit={submit}>
          {error && <p className="auth-error">{error}</p>}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Votre message…"
            maxLength={500}
            rows={3}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Envoi…' : 'Publier'}
          </button>
        </form>
      ) : (
        <p className="comments-login">
          <Link to="/login">Connectez-vous</Link> pour laisser un message.
        </p>
      )}

      <ul className="guestbook-list">
        {entries === null && <p className="blog-loading">Chargement…</p>}
        {entries && entries.length === 0 && (
          <p className="blog-empty">Soyez le premier à laisser un message.</p>
        )}
        {entries && entries.map((e) => (
          <motion.li
            key={e.id}
            className="guestbook-entry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="guestbook-message">{e.message}</p>
            <p className="guestbook-meta">
              — {e.display_name} &middot; {formatDate(e.created_at)}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
