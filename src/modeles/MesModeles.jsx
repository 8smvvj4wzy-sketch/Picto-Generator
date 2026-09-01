import { useRef, useState } from 'react'
import { dupliquer, importerModeles, listerModeles, supprimer } from './stockage.js'
import { analyserImport, exporterModeles, lireFichier } from './exportImport.js'

function dateLisible(horodatage) {
  if (!horodatage) return ''
  return new Date(horodatage).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Panneau « Mes modèles » : réouverture, duplication, suppression,
 * export et import JSON pour le partage entre collègues.
 */
export default function MesModeles({ onOuvrir, onFermer }) {
  const [modeles, setModeles] = useState(() => listerModeles())
  const [message, setMessage] = useState(null)
  const champFichier = useRef(null)

  const rafraichir = () => setModeles(listerModeles())

  async function surImport(evenement) {
    const fichier = evenement.target.files?.[0]
    evenement.target.value = ''
    if (!fichier) return
    const resultat = analyserImport(await lireFichier(fichier))
    if (resultat.erreur) {
      setMessage({ type: 'erreur', texte: resultat.erreur })
      return
    }
    const nombre = importerModeles(resultat.modeles)
    rafraichir()
    setMessage({
      type: 'succes',
      texte: `${nombre} modèle${nombre > 1 ? 's' : ''} importé${nombre > 1 ? 's' : ''}.`,
    })
  }

  return (
    <div className="modale" role="dialog" aria-modal="true" aria-label="Mes modèles">
      <div className="modale__boite">
        <header className="modale__entete">
          <h2>Mes modèles</h2>
          <button type="button" className="bouton bouton--discret" onClick={onFermer}>
            Fermer
          </button>
        </header>

        <div className="modale__barre">
          <button
            type="button"
            className="bouton"
            onClick={() => champFichier.current?.click()}
            title="Importer un fichier JSON reçu d’un collègue"
          >
            Importer un fichier…
          </button>
          <button
            type="button"
            className="bouton"
            disabled={modeles.length === 0}
            onClick={() => exporterModeles(modeles, 'mes-modeles')}
          >
            Exporter toute la bibliothèque
          </button>
          <input
            ref={champFichier}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={surImport}
          />
        </div>

        {message && (
          <p className={`message message--${message.type}`} role="status">
            {message.texte}
          </p>
        )}

        {modeles.length === 0 ? (
          <p className="modale__vide">
            Aucun modèle enregistré pour l’instant. Composez un support, puis utilisez
            « Enregistrer » dans l’en-tête.
          </p>
        ) : (
          <ul className="liste-modeles">
            {modeles.map((m) => (
              <li key={m.id} className="liste-modeles__item">
                <div className="liste-modeles__infos">
                  <strong>{m.nom}</strong>
                  <span className="liste-modeles__meta">
                    {m.support.type} — modifié le {dateLisible(m.dateModif)}
                  </span>
                </div>
                <div className="liste-modeles__actions">
                  <button type="button" className="bouton bouton--principal" onClick={() => onOuvrir(m)}>
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    className="bouton"
                    onClick={() => {
                      dupliquer(m.id)
                      rafraichir()
                    }}
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    className="bouton"
                    onClick={() => exporterModeles([m], m.nom)}
                  >
                    Exporter
                  </button>
                  <button
                    type="button"
                    className="bouton bouton--danger"
                    onClick={() => {
                      if (window.confirm(`Supprimer définitivement « ${m.nom} » ?`)) {
                        supprimer(m.id)
                        rafraichir()
                      }
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
