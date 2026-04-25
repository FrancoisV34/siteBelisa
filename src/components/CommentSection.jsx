import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function CommentSection({ postId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments || []))
      .catch(() => setComments([]))
  }, [postId])

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Erreur')
      setComments((prev) => [...(prev || []), data.comment])
      setContent('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="comments">
      <h2>Commentaires {comments && `(${comments.length})`}</h2>
      <ul className="comments-list">
        {comments && comments.map((c) => (
          <li key={c.id} className="comment">
            <div className="comment-head">
              <span className="comment-author">{c.display_name}</span>
              <span className="comment-date">{formatDate(c.created_at)}</span>
            </div>
            <p className="comment-body">{c.content}</p>
          </li>
        ))}
        {comments && comments.length === 0 && (
          <p className="comments-empty">Aucun commentaire pour l'instant.</p>
        )}
      </ul>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          {error && <p className="auth-error">{error}</p>}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Votre commentaire…"
            maxLength={2000}
            rows={4}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Envoi…' : 'Publier'}
          </button>
        </form>
      ) : (
        <p className="comments-login">
          <Link to="/login">Connectez-vous</Link> pour commenter.
        </p>
      )}
    </section>
  )
}
