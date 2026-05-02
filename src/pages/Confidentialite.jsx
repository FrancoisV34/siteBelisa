import { motion } from 'framer-motion'

export default function Confidentialite() {
  return (
    <div className="page legal-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1>Politique de confidentialité</h1>
        <p>
          La présente politique décrit comment vos données personnelles sont collectées
          et traitées dans le cadre de l'utilisation du site <strong>belisawagner</strong>.
          Elle est conforme au Règlement général sur la protection des données (RGPD)
          et à la loi française <em>Informatique et Libertés</em>.
        </p>

        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            Isabelle Vittecoq —{' '}
            <a href="mailto:vittecoqisabelle@gmail.com">vittecoqisabelle@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <ul>
            <li>
              <strong>Lors de l'inscription</strong>&nbsp;: adresse e-mail, nom affiché,
              mot de passe (stocké sous forme de hachage bcrypt et jamais lisible en clair).
            </li>
            <li>
              <strong>Lors de l'utilisation du site</strong>&nbsp;: commentaires,
              messages laissés dans le livre d'or, propositions d'articles, "j'aime".
            </li>
            <li>
              <strong>Pour la sécurité et la session</strong>&nbsp;: un cookie de session
              <code> sb_session</code> (HttpOnly, Secure, SameSite=Lax), un compteur de
              tentatives de connexion échouées (anti-bruteforce).
            </li>
          </ul>
          <p>
            Aucune donnée de navigation n'est collectée à des fins publicitaires. Le site
            <strong> n'utilise aucun service d'analyse tiers</strong> (pas de Google
            Analytics, pas de Meta Pixel, etc.) et ne dépose aucun cookie de mesure
            d'audience ou de traçage.
          </p>
        </section>

        <section>
          <h2>3. Finalités</h2>
          <ul>
            <li>Authentification et gestion du compte utilisateur.</li>
            <li>Affichage public des contributions (commentaires, livre d'or, articles publiés).</li>
            <li>Modération des contenus avant publication.</li>
            <li>Sécurité du service (anti-bruteforce, prévention des abus).</li>
          </ul>
        </section>

        <section>
          <h2>4. Base légale</h2>
          <p>
            Le traitement repose sur l'exécution du contrat de service auquel vous
            adhérez en créant un compte (article 6.1.b RGPD), ainsi que sur l'intérêt
            légitime du site à assurer sa sécurité (article 6.1.f RGPD).
          </p>
        </section>

        <section>
          <h2>5. Destinataires et sous-traitants</h2>
          <p>
            Les données sont hébergées par <strong>Cloudflare, Inc.</strong> (États-Unis),
            qui agit en qualité de sous-traitant et fournit les services de stockage
            (D1, R2) et la diffusion du site. Cloudflare présente les garanties requises
            par les Clauses contractuelles types de la Commission européenne pour les
            transferts hors UE.
          </p>
          <p>Aucune donnée n'est revendue ni transmise à des tiers à des fins commerciales.</p>
        </section>

        <section>
          <h2>6. Durée de conservation</h2>
          <ul>
            <li><strong>Compte</strong>&nbsp;: jusqu'à suppression par l'utilisateur.</li>
            <li><strong>Sessions</strong>&nbsp;: 30 jours, renouvelées à chaque connexion.</li>
            <li><strong>Sauvegardes techniques</strong>&nbsp;: jusqu'à 90 jours.</li>
            <li>
              <strong>Contributions publiques</strong> (commentaires, livre d'or, articles
              publiés)&nbsp;: conservées tant que le site est en ligne ; en cas de suppression
              du compte, l'auteur est anonymisé mais les contributions restent visibles.
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants&nbsp;: accès,
            rectification, effacement, opposition, limitation et portabilité.
          </p>
          <ul>
            <li>
              <strong>Accès / portabilité</strong>&nbsp;: depuis votre page <a href="/profil">profil</a>,
              cliquez sur "Exporter mes données" pour télécharger un fichier JSON contenant
              l'intégralité des informations qui vous concernent.
            </li>
            <li>
              <strong>Rectification</strong>&nbsp;: modifiez votre nom affiché depuis votre
              page profil. Pour toute autre rectification, contactez-nous.
            </li>
            <li>
              <strong>Effacement</strong>&nbsp;: depuis votre page profil, cliquez sur
              "Supprimer mon compte". Votre compte est immédiatement supprimé&nbsp;; vos
              contributions publiques sont anonymisées.
            </li>
            <li>
              <strong>Opposition / limitation</strong>&nbsp;: contactez-nous à l'adresse
              ci-dessous.
            </li>
          </ul>
          <p>
            Pour exercer ces droits&nbsp;:{' '}
            <a href="mailto:vittecoqisabelle@gmail.com">vittecoqisabelle@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>8. Réclamation auprès de la CNIL</h2>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire
            une réclamation auprès de la Commission nationale de l'informatique et des
            libertés (CNIL)&nbsp;:{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              www.cnil.fr
            </a>
            .
          </p>
        </section>

        <section>
          <h2>9. Modifications</h2>
          <p>
            La présente politique peut être mise à jour pour refléter des évolutions
            techniques ou légales. La version en vigueur est celle accessible à
            cette adresse.
          </p>
        </section>
      </motion.div>
    </div>
  )
}
