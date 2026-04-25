import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function Blog() {
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState(null)

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

      <section className="blog-list">
        {error && <p className="blog-error">Impossible de charger les articles : {error}</p>}
        {!error && posts === null && <p className="blog-loading">Chargement…</p>}
        {!error && posts && posts.length === 0 && (
          <p className="blog-empty">Aucun article publié pour le moment.</p>
        )}
        {posts && posts.map((p) => (
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
                  <img src={p.cover_image} alt="" loading="lazy" />
                </div>
              )}
              <div className="blog-card-body">
                <h2>{p.title}</h2>
                <p className="blog-card-meta">
                  {p.author_name} &middot; {formatDate(p.published_at)}
                </p>
                {p.excerpt && <p className="blog-card-excerpt">{p.excerpt}</p>}
              </div>
            </Link>
          </motion.article>
        ))}
      </section>
    </div>
  )
}
