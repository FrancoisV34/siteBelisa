import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Tablet } from 'lucide-react'

const staggerGrid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const cardVariant = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 28 },
  },
}

function Oeuvres() {
  const [oeuvres, setOeuvres] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/site/oeuvres')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setOeuvres(d.oeuvres))
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="page oeuvres-page">
      <section className="page-header">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Oeuvres
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Decouvrez une selection d'oeuvres realisees au fil des annees,
          temoignant d'un parcours artistique en constante evolution.
        </motion.p>
      </section>

      {error && <p className="blog-error" style={{ textAlign: 'center' }}>Erreur : {error}</p>}
      {!error && oeuvres === null && <p className="blog-loading">Chargement…</p>}
      {!error && oeuvres && oeuvres.length === 0 && (
        <p className="blog-empty">Œuvres à venir.</p>
      )}

      {oeuvres && oeuvres.length > 0 && (
        <motion.section
          className={`oeuvres-grid ${oeuvres.length % 2 === 0 ? 'even' : 'odd'}`}
          variants={staggerGrid}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 'some' }}
        >
          {oeuvres.map((oeuvre) => (
            <motion.article
              key={oeuvre.id}
              className="oeuvre-card"
              variants={cardVariant}
              whileHover={{ y: -6, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="oeuvre-image">
                {oeuvre.image_url ? (
                  <img src={oeuvre.image_url} alt={oeuvre.title} />
                ) : (
                  <div className="placeholder-image">{oeuvre.title}</div>
                )}
              </div>
              <div className="oeuvre-info">
                <h3>{oeuvre.title}</h3>
                <p className="oeuvre-meta">
                  {[oeuvre.year, oeuvre.technique, oeuvre.dimensions].filter(Boolean).join(' — ')}
                </p>
                {oeuvre.description && <p className="oeuvre-description">{oeuvre.description}</p>}
                {(oeuvre.book_url || oeuvre.ebook_url) && (
                  <div className="oeuvre-actions">
                    {oeuvre.book_url && (
                      <a href={oeuvre.book_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                        <BookOpen size={16} />
                        <span>Livre</span>
                      </a>
                    )}
                    {oeuvre.ebook_url && (
                      <a href={oeuvre.ebook_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                        <Tablet size={16} />
                        <span>Ebook</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </motion.section>
      )}
    </div>
  )
}

export default Oeuvres
