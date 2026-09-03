import { useEffect, useRef, useState } from 'react'
import Picto from '../support/Picto.jsx'
import { proposer } from '../bibliotheque/proposition.js'
import {
  ajouterCase,
  ajusterNombre,
  casesVides,
  referencePicto,
  retirerCase,
  TYPES,
} from '../support/modeleSupport.js'
import { ChampNombre, ChoixSegmente, Interrupteur, Ligne } from '../support/controles.jsx'

const QUANTITE_MIN = 1
const QUANTITE_MAX = 20
/** Anti-rebond de la proposition : assez court pour suivre la frappe. */
const DELAI_PROPOSITION = 250

function defaut() {
  return {
    type: TYPES.LISTE_COURSES,
    titre: 'Liste de courses',
    orientation: 'portrait',
    colonnes: 2,
    taillePicto: 'moyen',
    contraste: 'couleur',
    afficherCasesACocher: true,
    afficherLibelles: true,
    cases: casesVides(6),
  }
}

function Reglages({ support, modifier }) {
  return (
    <>
      <Ligne label="Nombre d’articles" aide="Modifiable aussi ligne par ligne dans l’aperçu">
        <ChampNombre
          valeur={support.cases.length}
          min={1}
          max={20}
          onChange={(n) => modifier({ cases: ajusterNombre(support.cases, n) })}
        />
      </Ligne>

      <Ligne label="Colonnes" aide="Deux colonnes tiennent une dizaine d’articles">
        <ChampNombre
          valeur={support.colonnes}
          min={1}
          max={3}
          onChange={(n) => modifier({ colonnes: n })}
        />
      </Ligne>

      <Ligne label="Taille des pictogrammes">
        <ChoixSegmente
          nom="Taille des pictogrammes"
          valeur={support.taillePicto}
          onChange={(v) => modifier({ taillePicto: v })}
          options={[
            { valeur: 'petit', libelle: 'Petit' },
            { valeur: 'moyen', libelle: 'Moyen' },
            { valeur: 'grand', libelle: 'Grand' },
          ]}
        />
      </Ligne>

      <Ligne label="Contraste">
        <ChoixSegmente
          nom="Contraste"
          valeur={support.contraste}
          onChange={(v) => modifier({ contraste: v })}
          options={[
            { valeur: 'couleur', libelle: 'Couleur' },
            { valeur: 'nb', libelle: 'Noir et blanc' },
          ]}
        />
      </Ligne>

      <Ligne label="Options">
        <Interrupteur
          label="Case à cocher par article"
          valeur={support.afficherCasesACocher}
          onChange={(v) => modifier({ afficherCasesACocher: v })}
        />
        <Interrupteur
          label="Mot écrit sous l’image"
          valeur={support.afficherLibelles}
          onChange={(v) => modifier({ afficherLibelles: v })}
        />
      </Ligne>
    </>
  )
}

/**
 * Un article de la liste.
 *
 * Écrire le mot générique suffit : au bout de `DELAI_PROPOSITION`, le meilleur
 * pictogramme correspondant se place tout seul et les alternatives s'affichent
 * sous la ligne sélectionnée. Un pictogramme choisi à la main (alternative ou
 * Bibliothèque) porte `pictoAuto: false` et n'est plus jamais remplacé par la
 * frappe — sans quoi une correction manuelle serait effacée à la lettre
 * suivante.
 */
function Article({
  index,
  article,
  support,
  pack,
  selectionne,
  onSelectionner,
  onModifierCase,
  onSupprimer,
  onAjouterApres,
}) {
  const [propositions, setPropositions] = useState([])

  // L'effet ne doit se déclencher que sur la frappe : l'état courant de
  // l'article est lu dans une référence pour ne pas le mettre en dépendance.
  const refArticle = useRef(article)
  refArticle.current = article

  useEffect(() => {
    const minuteur = setTimeout(() => {
      const courant = refArticle.current
      const trouves = proposer(pack, courant.libelle)
      setPropositions(trouves)

      if (courant.picto && courant.pictoAuto === false) return

      if (trouves.length === 0) {
        if (courant.picto && courant.pictoAuto) {
          onModifierCase(index, { picto: null, pictoAuto: false })
        }
        return
      }

      const meilleur = referencePicto(trouves[0])
      if (meilleur.id !== courant.picto?.id) {
        onModifierCase(index, { picto: meilleur, pictoAuto: true })
      }
    }, DELAI_PROPOSITION)

    return () => clearTimeout(minuteur)
  }, [article.libelle, pack, index, onModifierCase])

  function changerQuantite(delta) {
    const valeur = Math.min(QUANTITE_MAX, Math.max(QUANTITE_MIN, (article.quantite ?? 1) + delta))
    onModifierCase(index, { quantite: valeur })
  }

  return (
    <div
      className={`article ${selectionne ? 'case--selectionnee' : ''}`}
      onMouseDown={() => onSelectionner(index)}
    >
      {support.afficherCasesACocher && <span className="article__coche" aria-hidden="true" />}

      <div className="article__quantite">
        <span className="article__nombre">{article.quantite ?? 1}</span>
        <div className="article__pas sans-impression">
          <button
            type="button"
            onClick={() => changerQuantite(1)}
            aria-label={`Augmenter la quantité de l’article ${index + 1}`}
            title="Augmenter la quantité"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => changerQuantite(-1)}
            aria-label={`Diminuer la quantité de l’article ${index + 1}`}
            title="Diminuer la quantité"
          >
            −
          </button>
        </div>
      </div>

      <div className="article__picto">
        {article.picto ? (
          <Picto picto={article.picto} alt={article.libelle} />
        ) : (
          <span className="case__vide sans-impression">Écrivez le mot</span>
        )}
      </div>

      {support.afficherLibelles && (
        <input
          className="case__libelle article__libelle"
          value={article.libelle}
          placeholder="pomme, lait, pain…"
          onChange={(e) => onModifierCase(index, { libelle: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAjouterApres(index)
            }
          }}
          aria-label={`Nom de l’article ${index + 1}`}
        />
      )}

      <button
        type="button"
        className="article__supprimer sans-impression"
        onClick={() => onSupprimer(index)}
        aria-label={`Supprimer l’article ${index + 1}`}
        title="Supprimer cet article"
      >
        ✕
      </button>

      {/* Positionnée en absolu : les alternatives ne doivent pas décaler d'un
          millimètre l'aperçu par rapport à la feuille imprimée. */}
      {selectionne && propositions.length > 0 && (
        <div className="propositions sans-impression">
          <span className="propositions__titre">Autres images :</span>
          {propositions.map((picto) => (
            <button
              key={picto.id}
              type="button"
              className={`propositions__choix ${
                picto.id === article.picto?.id ? 'propositions__choix--actif' : ''
              }`}
              onClick={() => onModifierCase(index, { picto: referencePicto(picto), pictoAuto: false })}
              title={picto.motsCles?.join(', ')}
            >
              <Picto picto={picto} alt={picto.libelle} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Rendu({ support, pack, selection, onSelectionner, onModifierCase, modifier }) {
  const { cases, colonnes } = support

  function ajouterApres(index) {
    modifier({ cases: ajouterCase(cases, index) })
    onSelectionner(index + 1)
  }

  function supprimer(index) {
    if (cases.length <= 1) return
    modifier({ cases: retirerCase(cases, index) })
    onSelectionner(Math.max(0, Math.min(index, cases.length - 2)))
  }

  return (
    <div className="liste-courses" style={{ gridTemplateColumns: `repeat(${colonnes}, 1fr)` }}>
      {cases.map((article, index) => (
        <Article
          key={article.id}
          index={index}
          article={article}
          support={support}
          pack={pack}
          selectionne={selection === index}
          onSelectionner={onSelectionner}
          onModifierCase={onModifierCase}
          onSupprimer={supprimer}
          onAjouterApres={ajouterApres}
        />
      ))}
    </div>
  )
}

export default {
  id: TYPES.LISTE_COURSES,
  nom: 'Liste de courses',
  description: 'Une quantité et une image par article ; le picto est proposé en écrivant le mot.',
  defaut,
  Reglages,
  Rendu,
}
