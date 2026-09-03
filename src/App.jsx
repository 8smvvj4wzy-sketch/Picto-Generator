import { useCallback, useMemo, useRef, useState } from 'react'
import Bibliotheque from './bibliotheque/Bibliotheque.jsx'
import { useFavoris } from './bibliotheque/favoris.js'
import { usePictos } from './bibliotheque/usePictos.js'
import { EDITEURS, editeurPour } from './editeurs/registre.js'
import ModeCourse from './editeurs/ModeCourse.jsx'
import MesModeles from './modeles/MesModeles.jsx'
import { enregistrer } from './modeles/stockage.js'
import PageA4 from './support/PageA4.jsx'
import { referencePicto, TYPES } from './support/modeleSupport.js'
import ApercuMisEchelle from './impression/ApercuMisEchelle.jsx'
import EtatHorsLigne from './impression/EtatHorsLigne.jsx'

/** État initial : un support par type, pour ne rien perdre en changeant d'onglet. */
function supportsInitiaux() {
  return Object.fromEntries(EDITEURS.map((e) => [e.id, e.defaut()]))
}

export default function App() {
  const { etat, erreur, pack, categories } = usePictos()
  const { favoris, basculer } = useFavoris()

  const [supports, setSupports] = useState(supportsInitiaux)
  const [typeActif, setTypeActif] = useState(EDITEURS[0].id)
  const [selection, setSelection] = useState(0)
  const [modelesOuverts, setModelesOuverts] = useState(false)
  const [courseOuverte, setCourseOuverte] = useState(false)
  const [modeleCourant, setModeleCourant] = useState(null)
  const [message, setMessage] = useState(null)
  const minuteurMessage = useRef(null)

  const support = supports[typeActif]
  const editeur = editeurPour(typeActif)

  const annoncer = useCallback((texte) => {
    setMessage(texte)
    clearTimeout(minuteurMessage.current)
    minuteurMessage.current = setTimeout(() => setMessage(null), 4000)
  }, [])

  const modifier = useCallback(
    (champs) => {
      setSupports((tous) => ({ ...tous, [typeActif]: { ...tous[typeActif], ...champs } }))
    },
    [typeActif],
  )

  const modifierCase = useCallback(
    (index, champs) => {
      setSupports((tous) => {
        const courant = tous[typeActif]
        const cases = courant.cases.map((c, i) => (i === index ? { ...c, ...champs } : c))
        return { ...tous, [typeActif]: { ...courant, cases } }
      })
    },
    [typeActif],
  )

  /**
   * Clic sur un pictogramme de la Bibliothèque : il remplit la case
   * sélectionnée, puis la sélection avance vers la case suivante. Composer un
   * emploi du temps revient donc à enchaîner les clics, sans aller-retour.
   */
  const choisirPicto = useCallback(
    (picto) => {
      setSupports((tous) => {
        const courant = tous[typeActif]
        const cible =
          selection != null && selection < courant.cases.length
            ? selection
            : Math.max(
                0,
                courant.cases.findIndex((c) => !c.picto),
              )
        const cases = courant.cases.map((c, i) =>
          i === cible
            ? {
                ...c,
                picto: referencePicto(picto),
                libelle: c.libelle || picto.libelle,
                // Choix explicite : la liste de courses ne le remplacera plus
                // par sa proposition automatique à la frappe suivante.
                pictoAuto: false,
              }
            : c,
        )
        return { ...tous, [typeActif]: { ...courant, cases } }
      })
      setSelection((actuelle) => {
        const nombre = supports[typeActif].cases.length
        const suivante = (actuelle ?? 0) + 1
        return suivante < nombre ? suivante : actuelle
      })
    },
    [selection, supports, typeActif],
  )

  function changerType(type) {
    setTypeActif(type)
    setSelection(0)
    setModeleCourant(null)
    setCourseOuverte(false)
  }

  function enregistrerSupport() {
    const nom = window.prompt('Nom du modèle :', modeleCourant?.nom ?? support.titre)
    if (nom === null) return
    const modele = enregistrer(support, nom, modeleCourant?.id ?? null)
    setModeleCourant(modele)
    annoncer(`Modèle « ${modele.nom} » enregistré.`)
  }

  function ouvrirModele(modele) {
    setSupports((tous) => ({ ...tous, [modele.support.type]: modele.support }))
    setTypeActif(modele.support.type)
    setModeleCourant(modele)
    setSelection(0)
    setModelesOuverts(false)
    annoncer(`Modèle « ${modele.nom} » ouvert.`)
  }

  const cibleActive = useMemo(() => {
    if (typeActif === TYPES.JETONS) return 'renforçateur'
    if (typeActif === TYPES.LISTE_COURSES) return `article ${(selection ?? 0) + 1}`
    return `case ${(selection ?? 0) + 1}`
  }, [selection, typeActif])

  return (
    <div className="application">
      <header className="entete sans-impression">
        <div className="entete__marque">
          <span className="entete__logo" aria-hidden="true">
            ▦
          </span>
          <div>
            <h1>Générateur de supports visuels</h1>
            <p className="entete__sous-titre">Pictogrammes ARASAAC — impression A4</p>
          </div>
        </div>

        <nav className="onglets" aria-label="Type de support">
          {EDITEURS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`onglet ${typeActif === e.id ? 'onglet--actif' : ''}`}
              onClick={() => changerType(e.id)}
              title={e.description}
              aria-current={typeActif === e.id}
            >
              {e.nom}
            </button>
          ))}
        </nav>

        <div className="entete__actions">
          <EtatHorsLigne />
          {typeActif === TYPES.LISTE_COURSES && (
            <button type="button" className="bouton" onClick={() => setCourseOuverte(true)}>
              Mode course
            </button>
          )}
          <button type="button" className="bouton" onClick={() => setModelesOuverts(true)}>
            Mes modèles
          </button>
          <button type="button" className="bouton" onClick={enregistrerSupport}>
            Enregistrer
          </button>
          <button type="button" className="bouton bouton--principal" onClick={() => window.print()}>
            Imprimer
          </button>
        </div>
      </header>

      {message && (
        <p className="bandeau-message sans-impression" role="status">
          {message}
        </p>
      )}

      <main className="espace-travail">
        <section className="panneau panneau--bibliotheque sans-impression" aria-label="Bibliothèque">
          <Bibliotheque
            etat={etat}
            erreur={erreur}
            pack={pack}
            categories={categories}
            favoris={favoris}
            onBasculerFavori={basculer}
            onChoisir={choisirPicto}
            cibleActive={cibleActive}
          />
        </section>

        <section className="zone-apercu" aria-label="Aperçu du support">
          <ApercuMisEchelle paysage={support.orientation === 'paysage'}>
            <PageA4 support={support}>
              <editeur.Rendu
                support={support}
                pack={pack}
                selection={selection}
                onSelectionner={setSelection}
                onModifierCase={modifierCase}
                modifier={modifier}
              />
            </PageA4>
          </ApercuMisEchelle>
        </section>

        <section className="panneau panneau--reglages sans-impression" aria-label="Réglages">
          <h2 className="panneau__titre">Réglages</h2>

          <div className="reglage">
            <span className="reglage__label">Titre du support</span>
            <div className="reglage__champ">
              <input
                type="text"
                className="champ"
                value={support.titre}
                onChange={(e) => modifier({ titre: e.target.value })}
                placeholder="Titre imprimé en haut de la page"
              />
            </div>
          </div>

          <div className="reglage">
            <span className="reglage__label">Orientation</span>
            <div className="reglage__champ">
              <div className="segmente" role="radiogroup" aria-label="Orientation">
                {['portrait', 'paysage'].map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={support.orientation === o}
                    className={`segmente__option ${
                      support.orientation === o ? 'segmente__option--active' : ''
                    }`}
                    onClick={() => modifier({ orientation: o })}
                  >
                    {o === 'portrait' ? 'Portrait' : 'Paysage'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <editeur.Reglages support={support} modifier={modifier} />

          <p className="panneau__note">
            Cliquez sur une case de l’aperçu pour la sélectionner, puis sur un pictogramme de la
            Bibliothèque : la sélection avance toute seule.
          </p>
        </section>
      </main>

      {modelesOuverts && (
        <MesModeles onOuvrir={ouvrirModele} onFermer={() => setModelesOuverts(false)} />
      )}

      {courseOuverte && (
        <ModeCourse
          support={support}
          cle={modeleCourant?.id ?? 'courant'}
          onFermer={() => setCourseOuverte(false)}
        />
      )}
    </div>
  )
}
