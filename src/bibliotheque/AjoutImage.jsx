import { useRef, useState } from 'react'
import { useMesImages } from './mesImages.js'

/**
 * Ajout d'une image personnelle : photo du produit réel, pictogramme maison.
 *
 * Le fichier est choisi, réduit et enregistré sur l'appareil ; les mots-clés
 * saisis ici sont ceux qui la feront ressortir plus tard — c'est par eux que
 * la liste de courses la proposera quand l'accompagnant écrira le mot.
 */
export default function AjoutImage() {
  const { ajouter } = useMesImages()
  const champFichier = useRef(null)
  const [fichier, setFichier] = useState(null)
  const [mots, setMots] = useState('')
  const [erreur, setErreur] = useState(null)
  const [enCours, setEnCours] = useState(false)

  function reinitialiser() {
    setFichier(null)
    setMots('')
    setErreur(null)
    if (champFichier.current) champFichier.current.value = ''
  }

  async function valider(evenement) {
    evenement.preventDefault()
    if (!fichier) return
    setEnCours(true)
    setErreur(null)
    try {
      await ajouter(fichier, mots.split(','))
      reinitialiser()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <form className="ajout-image" onSubmit={valider}>
      <input
        ref={champFichier}
        type="file"
        accept="image/*"
        className="ajout-image__fichier"
        onChange={(e) => {
          setFichier(e.target.files?.[0] ?? null)
          setErreur(null)
        }}
        aria-label="Choisir une image sur l’appareil"
      />

      {fichier && (
        <>
          <input
            type="text"
            className="champ"
            value={mots}
            onChange={(e) => setMots(e.target.value)}
            placeholder="Mots-clés séparés par des virgules"
            aria-label="Mots-clés de l’image"
          />
          <div className="ajout-image__actions">
            <button type="submit" className="bouton bouton--principal" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Ajouter'}
            </button>
            <button type="button" className="bouton bouton--discret" onClick={reinitialiser}>
              Annuler
            </button>
          </div>
        </>
      )}

      {erreur && <p className="message message--erreur">{erreur}</p>}
    </form>
  )
}
