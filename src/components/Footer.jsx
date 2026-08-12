import { Link } from 'react-router'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
}

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <motion.div
          className="footer-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: "some" }}
          custom={0}
        >
          <h3>Belisa Wagner</h3>
          <p>Romanci&egrave;re</p>
        </motion.div>
        <motion.div
          className="footer-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: "some" }}
          custom={1}
        >
          <h3>Contact</h3>
          {/* The address itself lives on the legal pages, where publishing it
              is a legal obligation. Repeating it in the footer put it on every
              page, and Google surfaced it in the search snippet. */}
          <p>
            <Link to="/mentions-legales">Coordonn&eacute;es de contact</Link>
          </p>
        </motion.div>
        <motion.div
          className="footer-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: "some" }}
          custom={2}
        >
          <h3>Suivez-moi</h3>
          <div className="footer-socials">
            <a
              href="https://www.facebook.com/isavitt/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              Facebook
            </a>
          </div>
        </motion.div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Belisa Wagner. Tous droits r&eacute;serv&eacute;s.</p>
        <nav className="footer-legal" aria-label="Liens l&eacute;gaux">
          <Link to="/mentions-legales">Mentions l&eacute;gales</Link>
          <span aria-hidden="true">·</span>
          <Link to="/confidentialite">Politique de confidentialit&eacute;</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
