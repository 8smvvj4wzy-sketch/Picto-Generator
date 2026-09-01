/**
 * Écran affiché tant que public/pictos/index.json n'existe pas.
 *
 * Le pack n'est pas téléchargé par l'application : il est constitué une fois
 * pour toutes par un script, puis versionné dans le dépôt. Tant que ce n'est
 * pas fait, autant l'expliquer clairement plutôt que d'afficher une grille vide.
 */
export default function AccueilPackAbsent({ etat, erreur }) {
  return (
    <div className="pack-absent">
      <h2 className="pack-absent__titre">
        {etat === 'erreur' ? 'Pack de pictogrammes illisible' : 'Pack de pictogrammes à constituer'}
      </h2>

      {etat === 'erreur' ? (
        <p>
          Le fichier <code>public/pictos/index.json</code> n’a pas pu être lu
          {erreur ? ` (${erreur.message})` : ''}.
        </p>
      ) : (
        <p>
          Les pictogrammes ARASAAC sont embarqués dans l’application, mais le pack n’a pas encore
          été constitué. Une seule commande suffit, à lancer depuis le dossier du projet :
        </p>
      )}

      <pre className="pack-absent__commande">npm run build:pictos</pre>

      <ol className="pack-absent__etapes">
        <li>
          Le script lit <code>scripts/vocabulaire.json</code> (8 catégories, ~200 mots-clés).
        </li>
        <li>
          Il interroge l’API publique ARASAAC en français et télécharge chaque pictogramme dans{' '}
          <code>public/pictos/</code>.
        </li>
        <li>
          Il écrit <code>public/pictos/index.json</code>, seul fichier lu par l’application.
        </li>
        <li>
          Committez <code>public/pictos/</code> : c’est ce qui rend l’application autonome, wifi
          coupé comme en ligne.
        </li>
      </ol>

      <p className="pack-absent__note">
        Pour enrichir le pack plus tard : ajoutez un mot-clé dans{' '}
        <code>scripts/vocabulaire.json</code> et relancez la même commande.
      </p>

      <p className="pack-absent__licence">
        Les pictogrammes sont la propriété du Gouvernement d’Aragon, créés par Sergio Palao pour
        ARASAAC, et diffusés sous licence CC BY-NC-SA : attribution obligatoire, usage non
        commercial, partage à l’identique.
      </p>
    </div>
  )
}
