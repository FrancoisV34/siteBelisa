import { motion } from 'framer-motion'

/* ---- Animation variants ---- */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
}

function Home() {
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
          <h1>Prenom Nom</h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Artiste &bull; Createur &bull; Visionnaire
          </motion.p>
        </motion.div>
      </section>

      {/* A propos */}
      <section className="about">
        <div className="about-container">
          <motion.div
            className="about-image"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <div className="placeholder-image">Photo</div>
          </motion.div>

          <motion.div
            className="about-text"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.h2 variants={fadeUp}>A propos</motion.h2>
            <motion.p variants={fadeUp}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
              ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
              aliquip ex ea commodo consequat.
            </motion.p>
            <motion.p variants={fadeUp}>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.
            </motion.p>
            <motion.p variants={fadeUp}>
              Nee au coeur de Paris, cette passion pour l'art s'est developpee
              des le plus jeune age. Apres des etudes aux Beaux-Arts, un parcours
              riche en expositions et en collaborations a forge une identite
              artistique unique, entre tradition et modernite.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Chiffres */}
      <section className="highlights">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
        >
          En quelques chiffres
        </motion.h2>

        <motion.div
          className="highlights-grid"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {[
            { number: '50+', label: 'Oeuvres realisees' },
            { number: '20+', label: 'Expositions' },
            { number: '15', label: "Annees d'experience" },
            { number: '5', label: 'Prix et distinctions' },
          ].map((item) => (
            <motion.div
              key={item.label}
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
    </div>
  )
}

export default Home
