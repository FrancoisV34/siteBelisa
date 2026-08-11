import { useEffect, useState, lazy, Suspense } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { PenLine } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { formatDate, isoDate } from '../lib/date.js'

// TipTap weighs ~500 KB and only ever loads inside this modal. Importing it
// eagerly here put the whole rich-text editor in the main bundle, so every
// anonymous visitor downloaded it just to read the blog.
const SubmitArticleModal = lazy(() => import('../components/SubmitArticleModal.jsx'))

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const PER_PAGE = 20

export default function Blog() {
  const { user } = useAuth()
  const { page: pageParam } = useParams()
  const navigate = useNavigate()
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const [posts, setPosts] = useState(null)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  useEffect(() => {
    setPosts(null)
    setError(null)
    const offset = (page - 1) * PER_PAGE
    fetch(`/api/posts?limit=${PER_PAGE}&offset=${offset}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((data) => {
        setPosts(data.posts)
        setTotal(data.total ?? data.posts.length)
        // A page number past the end is a dead URL; send it back to the list
        // rather than showing an empty shell.
        if (data.posts.length === 0 && page > 1) navigate('/blog', { replace: true })
      })
      .catch((e) => setError(e.message))
  }, [page, navigate])

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))

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

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Pages du blog">
          {page > 1 && (
            <Link
              to={page === 2 ? '/blog' : `/blog/page/${page - 1}`}
              className="pagination-link"
              rel="prev"
            >
              ← Précédent
            </Link>
          )}
          <span className="pagination-status" aria-current="page">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages && (
            <Link to={`/blog/page/${page + 1}`} className="pagination-link" rel="next">
              Suivant →
            </Link>
          )}
        </nav>
      )}

      {modalOpen && (
        <Suspense fallback={null}>
          <SubmitArticleModal
            mode="create"
            onClose={() => setModalOpen(false)}
            onSuccess={() => setSubmitMessage('Proposition envoyée. Elle sera relue avant publication.')}
          />
        </Suspense>
      )}
    </div>
  )
}
