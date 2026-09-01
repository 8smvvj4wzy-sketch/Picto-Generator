import PiedDePage from './PiedDePage.jsx'

/**
 * Cadre A4 partagé par les trois éditeurs.
 *
 * Le même DOM sert à l'aperçu écran et à l'impression : la feuille
 * src/impression/impression.css se contente de retirer l'ombre, la mise à
 * l'échelle et les décorations d'interface. C'est ce qui garantit le critère
 * « le rendu à l'écran est identique au rendu imprimé ».
 */
export default function PageA4({ support, children }) {
  const paysage = support.orientation === 'paysage'
  const classes = [
    'page',
    paysage ? 'page--paysage' : 'page--portrait',
    `page--taille-${support.taillePicto ?? 'moyen'}`,
    support.contraste === 'nb' ? 'page--noir-et-blanc' : 'page--couleur',
  ].join(' ')

  return (
    <>
      {/* @page n'accepte pas de sélecteur : l'orientation doit être injectée. */}
      <style>{`@page { size: A4 ${paysage ? 'landscape' : 'portrait'}; margin: 10mm; }`}</style>
      <article className={classes}>
        {support.titre?.trim() ? <h1 className="page__titre">{support.titre}</h1> : null}
        <div className="page__contenu">{children}</div>
        <PiedDePage />
      </article>
    </>
  )
}
