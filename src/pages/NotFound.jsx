import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function NotFound() {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 2rem',
        background: '#fafaf8',
        color: '#1d1d1f',
      }}
    >
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '6rem', fontWeight: 400, margin: 0, lineHeight: 1 }}>
        404
      </h1>
      <h2 style={{ fontFamily: 'system-ui, sans-serif', fontSize: '1.5rem', fontWeight: 400, margin: '1rem 0 0.75rem' }}>
        Page introuvable
      </h2>
      <p style={{ fontFamily: 'system-ui, sans-serif', color: '#6e6e73', maxWidth: '380px', marginBottom: '2.5rem' }}>
        Cette page n'existe pas ou a été déplacée. Revenez à l'accueil pour continuer votre visite.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
        <Link to="/oeuvres" className="btn btn-secondary">Voir les œuvres</Link>
      </div>
    </motion.div>
  )
}
