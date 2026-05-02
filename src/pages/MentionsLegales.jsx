import { motion } from 'framer-motion'

export default function MentionsLegales() {
  return (
    <div className="page legal-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Mentions légales</h1>

        <section>
          <h2>Éditeur du site</h2>
          <p>
            Le site <strong>belisawagner</strong> est édité par&nbsp;:
          </p>
          <ul>
            <li>Isabelle Vittecoq, agissant sous le nom d'auteure <em>Belisa Wagner</em></li>
            <li>Adresse postale&nbsp;: disponible sur demande</li>
            <li>
              Contact&nbsp;:{' '}
              <a href="mailto:vittecoqisabelle@gmail.com">vittecoqisabelle@gmail.com</a>
            </li>
          </ul>
        </section>

        <section>
          <h2>Directrice de la publication</h2>
          <p>Isabelle Vittecoq.</p>
        </section>

        <section>
          <h2>Hébergement</h2>
          <p>
            Le site est hébergé par <strong>Cloudflare, Inc.</strong>, 101 Townsend Street,
            San Francisco, CA 94107, États-Unis. Site&nbsp;:{' '}
            <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">
              cloudflare.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus présents sur ce site (textes, articles, œuvres,
            illustrations, photographies, mise en page) est la propriété exclusive
            d'Isabelle&nbsp;Vittecoq, sauf mention contraire. Toute reproduction,
            représentation, modification ou diffusion, totale ou partielle, sans
            autorisation écrite préalable est interdite et constitue une contrefaçon
            sanctionnée par le code de la propriété intellectuelle.
          </p>
          <p>
            Les contenus proposés par les utilisateurs (commentaires, livre d'or,
            propositions d'articles) restent la propriété de leurs auteurs, qui
            concèdent au site une licence non exclusive de diffusion dans le cadre
            du service.
          </p>
        </section>

        <section>
          <h2>Données personnelles</h2>
          <p>
            Les modalités de collecte et de traitement des données personnelles sont
            décrites dans la{' '}
            <a href="/confidentialite">politique de confidentialité</a>.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Pour toute question relative au site&nbsp;:{' '}
            <a href="mailto:vittecoqisabelle@gmail.com">vittecoqisabelle@gmail.com</a>
            .
          </p>
        </section>
      </motion.div>
    </div>
  )
}
