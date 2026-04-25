import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LikeButton({ postId }) {
  const { user } = useAuth()
  const [count, setCount] = useState(0)
  const [liked, setLiked] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${postId}/like`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setCount(d.count); setLiked(d.liked) })
      .catch(() => {})
  }, [postId])

  const toggle = async () => {
    if (!user || busy) return
    setBusy(true)
    try {
      const r = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST', credentials: 'include',
      })
      const data = await r.json()
      if (r.ok) { setCount(data.count); setLiked(data.liked) }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      className={`like-btn ${liked ? 'liked' : ''}`}
      onClick={toggle}
      disabled={!user || busy}
      aria-label={user ? (liked ? 'Retirer le like' : 'Aimer') : 'Connectez-vous pour aimer'}
      title={user ? '' : 'Connectez-vous pour aimer'}
    >
      <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
      <span>{count}</span>
    </button>
  )
}
