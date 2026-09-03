import { useMemo, useState } from 'react'
import Picto from '../support/Picto.jsx'
import { rechercher } from './recherche.js'
import AccueilPackAbsent from './AccueilPackAbsent.jsx'
import AjoutImage from './AjoutImage.jsx'
import { useMesImages } from './mesImages.js'

const LIMITE_AFFICHAGE = 120

/**
 * Panneau Bibliothèque : recherche, filtres par catégorie, favoris.
 * Un clic sur une vignette insère le pictogramme dans le support en cours.
 *
 * Les images personnelles sont mêlées au pack par `usePictos` : elles se
 * cherchent et s'insèrent comme les autres, et se reconnaissent à leur
 * `dataURL` — la seule différence tient à leur suppression, possible ici.
 */
export default function Bibliotheque({
  etat,
  erreur,
  pack,
  categories,
  favoris,
  onBasculerFavori,
  onChoisir,
  cibleActive,
}) {
  const [requete, setRequete] = useState('')
  const [categorie, setCategorie] = useState(null)
  const [seulementFavoris, setSeulementFavoris] = useState(false)
  const [toutAfficher, setToutAfficher] = useState(false)
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const { supprimer } = useMesImages()

  const resultats = useMemo(() => {
    const trouves = rechercher(pack, { requete, categorie, favoris })
    return seulementFavoris ? trouves.filter((p) => favoris.includes(p.id)) : trouves
  }, [pack, requete, categorie, favoris, seulementFavoris])

  if (etat === 'chargement') {
    return <div className="panneau__vide">Chargement du pack…</div>
  }
  if (etat !== 'pret') {
    return <AccueilPackAbsent etat={etat} erreur={erreur} />
  }

  const affiches = toutAfficher ? resultats : resultats.slice(0, LIMITE_AFFICHAGE)

  return (
    <div className="bibliotheque">
      <div className="bibliotheque__recherche">
        <input
          type="search"
          className="champ champ--recherche"
          placeholder="Rechercher un pictogramme…"
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value)
            setToutAfficher(false)
          }}
          autoComplete="off"
          aria-label="Rechercher un pictogramme"
        />
        <button
          type="button"
          className={`bouton ${ajoutOuvert ? 'bouton--principal' : ''}`}
          onClick={() => setAjoutOuvert((v) => !v)}
          aria-expanded={ajoutOuvert}
          title="Ajouter une photo ou une image personnelle"
        >
          + Image
        </button>
      </div>

      {ajoutOuvert && <AjoutImage />}

      <div className="bibliotheque__filtres">
        <button
          type="button"
          className={`puce ${!categorie && !seulementFavoris ? 'puce--active' : ''}`}
          onClick={() => {
            setCategorie(null)
            setSeulementFavoris(false)
          }}
        >
          Tout
        </button>
        <button
          type="button"
          className={`puce ${seulementFavoris ? 'puce--active' : ''}`}
          onClick={() => {
            setSeulementFavoris((v) => !v)
            setCategorie(null)
          }}
          title="N’afficher que les favoris"
        >
          ★ Favoris{favoris.length ? ` (${favoris.length})` : ''}
        </button>
        {categories.map((c) => (
          <button
            key={c.nom}
            type="button"
            className={`puce ${categorie === c.nom ? 'puce--active' : ''}`}
            onClick={() => {
              setCategorie(categorie === c.nom ? null : c.nom)
              setSeulementFavoris(false)
            }}
          >
            {c.nom} <span className="puce__compte">{c.nombre}</span>
          </button>
        ))}
      </div>

      <p className="bibliotheque__etat" aria-live="polite">
        {resultats.length === 0
          ? 'Aucun pictogramme ne correspond.'
          : `${resultats.length} pictogramme${resultats.length > 1 ? 's' : ''}`}
        {cibleActive ? ` — clic = ${cibleActive}` : ''}
      </p>

      <div className="grille-pictos">
        {affiches.map((picto) => {
          const favori = favoris.includes(picto.id)
          return (
            <div key={picto.id} className={`vignette ${favori ? 'vignette--favorite' : ''}`}>
              <button
                type="button"
                className="vignette__bouton"
                onClick={() => onChoisir(picto)}
                title={picto.motsCles.join(', ')}
              >
                <Picto picto={picto} alt={picto.libelle} />
                <span className="vignette__libelle">{picto.libelle}</span>
              </button>
              <button
                type="button"
                className="vignette__favori"
                onClick={() => onBasculerFavori(picto.id)}
                aria-pressed={favori}
                aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                title={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                {favori ? '★' : '☆'}
              </button>
              {picto.dataURL && (
                <button
                  type="button"
                  className="vignette__supprimer"
                  onClick={() => supprimer(picto.id)}
                  aria-label={`Supprimer l’image ${picto.libelle}`}
                  title="Supprimer cette image personnelle"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {!toutAfficher && resultats.length > LIMITE_AFFICHAGE && (
        <button type="button" className="bouton bouton--discret" onClick={() => setToutAfficher(true)}>
          Afficher les {resultats.length - LIMITE_AFFICHAGE} pictogrammes suivants
        </button>
      )}
    </div>
  )
}
