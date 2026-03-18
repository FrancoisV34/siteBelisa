import { motion } from 'framer-motion'
import { BookOpen, Tablet } from 'lucide-react'

const oeuvres = [
  {
    id: 1,
    title: "Lumiere d'automne",
    year: 2023,
    technique: 'Huile sur toile',
    dimensions: '120 x 80 cm',
    description:
      'Une exploration des teintes chaudes de la saison, capturant la lumiere doree qui traverse le feuillage.',
    livreUrl: '#',
    ebookUrl: '#',
  },
  {
    id: 2,
    title: 'Horizons lointains',
    year: 2022,
    technique: 'Acrylique sur toile',
    dimensions: '150 x 100 cm',
    description:
      'Paysage abstrait evoquant les grands espaces et la liberte, dans des tons de bleu et de gris.',
    livreUrl: '#',
    ebookUrl: '#',
  },
  {
    id: 3,
    title: 'Fragments urbains',
    year: 2022,
    technique: 'Technique mixte',
    dimensions: '90 x 90 cm',
    description:
      "Composition geometrique inspiree de l'architecture parisienne, melant collage et peinture.",
    livreUrl: '#',
    ebookUrl: '#',
  },
  {
    id: 4,
    title: 'Le silence des pierres',
    year: 2021,
    technique: 'Aquarelle',
    dimensions: '60 x 40 cm',
    description:
      "Serie d'aquarelles representant des formations rocheuses, explorant la texture et la transparence.",
    livreUrl: '#',
    ebookUrl: '#',
  },
  {
    id: 5,
    title: 'Danse nocturne',
    year: 2021,
    technique: 'Huile sur toile',
    dimensions: '100 x 130 cm',
    description:
      'Figures en mouvement dans une atmosphere sombre et enveloppante, jouant sur les contrastes.',
    livreUrl: '#',
    ebookUrl: '#',
  },
  {
    id: 6,
    title: 'Echos du passe',
    year: 2020,
    technique: 'Technique mixte',
    dimensions: '80 x 120 cm',
    description:
      'Oeuvre combinant photographie ancienne et peinture, un dialogue entre memoire et creation.',
    livreUrl: '#',
    ebookUrl: '#',
  },
]

const staggerGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariant = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 28,
    },
  },
}

function Oeuvres() {
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

      <motion.section
        className="oeuvres-grid"
        variants={staggerGrid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.05 }}
      >
        {oeuvres.map((oeuvre) => (
          <motion.article
            key={oeuvre.id}
            className="oeuvre-card"
            variants={cardVariant}
            whileHover={{
              y: -6,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="oeuvre-image">
              <div className="placeholder-image">{oeuvre.title}</div>
            </div>
            <div className="oeuvre-info">
              <h3>{oeuvre.title}</h3>
              <p className="oeuvre-meta">
                {oeuvre.year} &mdash; {oeuvre.technique} &mdash;{' '}
                {oeuvre.dimensions}
              </p>
              <p className="oeuvre-description">{oeuvre.description}</p>
              <div className="oeuvre-actions">
                <a href={oeuvre.livreUrl} className="btn btn-primary">
                  <BookOpen size={16} />
                  <span>Livre</span>
                </a>
                <a href={oeuvre.ebookUrl} className="btn btn-secondary">
                  <Tablet size={16} />
                  <span>Ebook</span>
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.section>
    </div>
  )
}

export default Oeuvres
