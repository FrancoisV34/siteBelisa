import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
}

function Home() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/site/home')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  const hero = data?.hero || { title: 'Belisa Wagner', subtitle: '' }
  const sections = data?.sections || []
  const stats = data?.stats || []

  return (
    <div className="page home-page">
      {/* Hero */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h1>{hero.title}</h1>
          {hero.subtitle && (
            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {hero.subtitle}
            </motion.p>
          )}
        </motion.div>
      </section>

      {error && <p className="blog-error" style={{ textAlign: 'center', padding: '2rem' }}>Erreur : {error}</p>}

      {/* Sections (about + extras) */}
      {sections.map((sec, i) => (
        <section key={sec.id} className={`about ${i % 2 === 1 ? 'about-reverse' : ''}`}>
          <div className="about-container">
            {sec.image_url && (
              <motion.div
                className="about-image"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 'some' }}
              >
                <img src={sec.image_url} alt={sec.title} className="about-photo" />
              </motion.div>
            )}
            <motion.div
              className="about-text"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 'some' }}
            >
              <motion.h2 variants={fadeUp}>{sec.title}</motion.h2>
              <motion.div
                variants={fadeUp}
                className="about-body"
                dangerouslySetInnerHTML={{ __html: sec.body_html }}
              />
            </motion.div>
          </div>
        </section>
      ))}

      {/* Chiffres */}
      {stats.length > 0 && (
        <section className="highlights">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 'some' }}
          >
            En quelques chiffres
          </motion.h2>

          <motion.div
            className="highlights-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 'some' }}
          >
            {stats.map((item) => (
              <motion.div
                key={item.id}
                className="highlight-card"
                variants={scaleIn}
                whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <span className="highlight-number">{item.number}</span>
                <span className="highlight-label">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}
    </div>
  )
}

export default Home
