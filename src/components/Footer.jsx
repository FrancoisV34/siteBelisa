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
          viewport={{ once: true, amount: 0.3 }}
          custom={0}
        >
          <h3>Prenom Nom</h3>
          <p>Artiste &mdash; Createur</p>
        </motion.div>
        <motion.div
          className="footer-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={1}
        >
          <h3>Contact</h3>
          <p>email@exemple.com</p>
          <p>+33 1 23 45 67 89</p>
        </motion.div>
        <motion.div
          className="footer-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          custom={2}
        >
          <h3>Suivez-moi</h3>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="LinkedIn">LinkedIn</a>
            <a href="#" aria-label="Twitter">Twitter</a>
          </div>
        </motion.div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Prenom Nom. Tous droits reserves.</p>
      </div>
    </footer>
  )
}

export default Footer
