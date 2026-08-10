import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { PenLine } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import SubmitArticleModal from '../components/SubmitArticleModal.jsx'
import { formatDate, isoDate } from '../lib/date.js'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function Blog() {
  const { user } = useAuth()
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((data) => setPosts(data.posts))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="page blog-page">
      <section className="blog-hero">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Blog
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Réflexions, actualités et coulisses de l'atelier.
        </motion.p>
      </section>

      {user && (
        <div className="blog-submit-bar">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <PenLine size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            Proposer un article
          </button>
        </div>
      )}

      {submitMessage && <p className="auth-success" style={{ maxWidth: 720, margin: '0 auto 1.5rem' }}>{submitMessage}</p>}

      <section className="blog-list">
        {error && <p className="blog-error">Impossible de charger les articles : {error}</p>}
        {!error && posts === null && <p className="blog-loading">Chargement…</p>}
        {!error && posts && posts.length === 0 && (
          <p className="blog-empty">Aucun article publié pour le moment.</p>
        )}
        {posts && posts.map((p, i) => (
          <motion.article
            key={p.id}
            className="blog-card"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 'some' }}
          >
            <Link to={`/blog/${p.slug}`} className="blog-card-link">
              {p.cover_image && (
                <div className="blog-card-cover">
                  <img
                    src={p.cover_image}
                    alt={p.image_alt || p.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                  />
                </div>
              )}
              <div className="blog-card-body">
                <h2>{p.title}</h2>
                <p className="blog-card-meta">
                  {p.author_name} &middot;{' '}
                  <time dateTime={isoDate(p.published_at)}>{formatDate(p.published_at)}</time>
                </p>
                {p.excerpt && <p className="blog-card-excerpt">{p.excerpt}</p>}
              </div>
            </Link>
          </motion.article>
        ))}
      </section>

      {modalOpen && (
        <SubmitArticleModal
          mode="create"
          onClose={() => setModalOpen(false)}
          onSuccess={() => setSubmitMessage('Proposition envoyée. Elle sera relue avant publication.')}
        />
      )}
    </div>
  )
}
