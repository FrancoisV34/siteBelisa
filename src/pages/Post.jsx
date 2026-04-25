import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import LikeButton from '../components/LikeButton.jsx'
import CommentSection from '../components/CommentSection.jsx'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Post() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setPost(null)
    setError(null)
    fetch(`/api/posts/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Article introuvable')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then((data) => setPost(data.post))
      .catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return (
      <div className="page post-page">
        <section className="post-error">
          <h1>{error}</h1>
          <Link to="/blog" className="btn btn-secondary">Retour au blog</Link>
        </section>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="page post-page">
        <p className="blog-loading">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="page post-page">
      <motion.article
        className="post-article"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {post.cover_image && (
          <div className="post-cover">
            <img src={post.cover_image} alt="" />
          </div>
        )}
        <header className="post-header">
          <h1>{post.title}</h1>
          <p className="post-meta">
            {post.author_name} &middot; {formatDate(post.published_at)}
          </p>
        </header>
        <div
          className="post-content"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />
        <div className="post-actions">
          <LikeButton postId={post.id} />
        </div>
        <CommentSection postId={post.id} />
        <footer className="post-footer">
          <Link to="/blog" className="btn btn-secondary">← Retour au blog</Link>
        </footer>
      </motion.article>
    </div>
  )
}
