import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { motion } from 'framer-motion'
import { BookOpen, Tablet, ChevronLeft, ChevronRight } from 'lucide-react'

export default function Oeuvre() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setData(null)
    setError(null)
    fetch(`/api/site/oeuvres/${encodeURIComponent(slug)}`)
      .then((r) => {
        if (r.status === 404) throw new Error('Ouvrage introuvable')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [slug])

  if (error) {
    return (
      <div className="page oeuvre-page">
        <section className="post-error">
          <h1>{error}</h1>
          <Link to="/oeuvres" className="btn btn-secondary">Retour aux ouvrages</Link>
        </section>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="page oeuvre-page">
        <p className="blog-loading">Chargement…</p>
      </div>
    )
  }

  const { oeuvre, prev, next } = data
  const meta = [oeuvre.year, oeuvre.technique, oeuvre.dimensions].filter(Boolean).join(' — ')

  return (
    <div className="page oeuvre-page">
      <nav className="breadcrumb" aria-label="Fil d'Ariane">
        <ol>
          <li><Link to="/">Accueil</Link></li>
          <li><Link to="/oeuvres">Les ouvrages</Link></li>
          <li aria-current="page">{oeuvre.title}</li>
        </ol>
      </nav>

      <motion.article
        className="oeuvre-detail"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {oeuvre.image_url && (
          <div className="oeuvre-detail-image">
            <img
              src={oeuvre.image_url}
              alt={`Couverture de « ${oeuvre.title} »`}
              fetchPriority="high"
            />
          </div>
        )}

        <div className="oeuvre-detail-body">
          <h1>{oeuvre.title}</h1>
          {meta && <p className="oeuvre-meta">{meta}</p>}
          {oeuvre.description && <p className="oeuvre-description">{oeuvre.description}</p>}
          {oeuvre.isbn && <p className="oeuvre-isbn">ISBN&nbsp;: {oeuvre.isbn}</p>}

          {(oeuvre.book_url || oeuvre.ebook_url) && (
            <div className="oeuvre-actions">
              {oeuvre.book_url && (
                <a
                  href={oeuvre.book_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="btn btn-primary"
                >
                  <BookOpen size={16} />
                  <span>Acheter le livre</span>
                </a>
              )}
              {oeuvre.ebook_url && (
                <a
                  href={oeuvre.ebook_url}
                  target="_blank"
                  rel="noopener noreferrer sponsored nofollow"
                  className="btn btn-secondary"
                >
                  <Tablet size={16} />
                  <span>Acheter l'ebook</span>
                </a>
              )}
            </div>
          )}
        </div>
      </motion.article>

      <nav className="oeuvre-nav" aria-label="Autres ouvrages">
        {prev ? (
          <Link to={`/oeuvres/${prev.slug}`} className="oeuvre-nav-link">
            <ChevronLeft size={16} />
            <span>{prev.title}</span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/oeuvres/${next.slug}`} className="oeuvre-nav-link oeuvre-nav-next">
            <span>{next.title}</span>
            <ChevronRight size={16} />
          </Link>
        )}
      </nav>

      <div className="oeuvre-footer">
        <Link to="/oeuvres" className="btn btn-secondary">← Tous les ouvrages</Link>
      </div>
    </div>
  )
}
