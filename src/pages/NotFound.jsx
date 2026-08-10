import { Link } from 'react-router'
import { motion } from 'framer-motion'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function NotFound() {
  return (
    <motion.div
      className="notfound"
      variants={fadeUp}
      initial="initial"
      animate="animate"
    >
      <p className="notfound-eyebrow">Erreur 404</p>
      <h1>Il manque une page à ce livre</h1>
      <p className="notfound-text">
        Celle que vous cherchez n'a jamais été écrite, ou bien elle a changé de
        titre en cours de route. Le reste de l'histoire, lui, est toujours là.
      </p>
      <div className="notfound-actions">
        <Link to="/" className="btn btn-primary">Revenir à l'accueil</Link>
        <Link to="/oeuvres" className="btn btn-secondary">Parcourir les ouvrages</Link>
        <Link to="/blog" className="btn btn-secondary">Lire le blog</Link>
      </div>
    </motion.div>
  )
}
