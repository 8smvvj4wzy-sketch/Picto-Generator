import { useEffect, useState } from 'react'
import Picto from '../support/Picto.jsx'

const CLE = 'picto-generator:course:v1'

/**
 * Mode course : la liste sur l'écran, en magasin.
 *
 * L'impression reste la sortie de référence, mais une tablette évite le
 * crayon et le papier froissé au fond du caddie. Un appui sur un article le
 * marque comme pris ; rien n'est modifié dans le support, seul l'état « pris »
 * est conservé — en localStorage, pour survivre à une mise en veille ou à une
 * fermeture d'onglet au milieu des rayons.
 */

function lireEtat(cle) {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const valeur = JSON.parse(brut)
    return Array.isArray(valeur?.[cle]) ? valeur[cle] : []
  } catch {
    return []
  }
}

function ecrireEtat(cle, pris) {
  try {
    const brut = localStorage.getItem(CLE)
    const valeur = brut ? JSON.parse(brut) : {}
    localStorage.setItem(CLE, JSON.stringify({ ...valeur, [cle]: pris }))
  } catch {
    /* stockage plein ou refusé : le mode course reste utilisable sans mémoire */
  }
}

export default function ModeCourse({ support, cle = 'courant', onFermer }) {
  const [pris, setPris] = useState(() => lireEtat(cle))

  useEffect(() => {
    ecrireEtat(cle, pris)
  }, [cle, pris])

  useEffect(() => {
    function surTouche(evenement) {
      if (evenement.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  // Un article vide (ni image ni mot) n'a rien à faire dans le caddie.
  const articles = support.cases.filter((c) => c.picto || c.libelle.trim())
  const faits = articles.filter((c) => pris.includes(c.id)).length

  function basculer(id) {
    setPris((actuels) =>
      actuels.includes(id) ? actuels.filter((i) => i !== id) : [...actuels, id],
    )
  }

  return (
    <div className="mode-course" role="dialog" aria-modal="true" aria-label="Mode course">
      <header className="mode-course__entete">
        <h2 className="mode-course__titre">{support.titre || 'Liste de courses'}</h2>
        <span className="mode-course__progression" aria-live="polite">
          {faits} sur {articles.length}
        </span>
        <div className="mode-course__actions">
          <button
            type="button"
            className="bouton"
            onClick={() => setPris([])}
            disabled={faits === 0}
          >
            Tout décocher
          </button>
          <button type="button" className="bouton bouton--principal" onClick={onFermer}>
            Fermer
          </button>
        </div>
      </header>

      {articles.length === 0 ? (
        <p className="mode-course__vide">
          La liste est vide : ajoutez des articles avant de partir en courses.
        </p>
      ) : (
        <div className="mode-course__liste">
          {articles.map((article) => {
            const coche = pris.includes(article.id)
            return (
              <button
                key={article.id}
                type="button"
                className={`mode-course__article ${
                  coche ? 'mode-course__article--pris' : ''
                }`}
                onClick={() => basculer(article.id)}
                aria-pressed={coche}
              >
                <span className="mode-course__quantite">{article.quantite ?? 1}</span>
                <span className="mode-course__image">
                  {article.picto ? <Picto picto={article.picto} alt="" /> : null}
                </span>
                <span className="mode-course__mot">{article.libelle}</span>
                <span className="mode-course__coche" aria-hidden="true">
                  {coche ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
