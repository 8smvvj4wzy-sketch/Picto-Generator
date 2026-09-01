import { useEffect, useState } from 'react'

/**
 * Indicateur de disponibilité hors ligne.
 *
 * Le service worker met l'application puis le pack de pictogrammes en cache,
 * et signale sa progression. Tant que ce n'est pas terminé, l'utilisateur sait
 * qu'il ne peut pas encore couper le wifi.
 */
export default function EtatHorsLigne() {
  const [progression, setProgression] = useState(null)
  const [enLigne, setEnLigne] = useState(navigator.onLine)

  useEffect(() => {
    const majReseau = () => setEnLigne(navigator.onLine)
    window.addEventListener('online', majReseau)
    window.addEventListener('offline', majReseau)

    function surMessage(evenement) {
      if (evenement.data?.type === 'pack-hors-ligne') setProgression(evenement.data)
    }
    navigator.serviceWorker?.addEventListener('message', surMessage)

    return () => {
      window.removeEventListener('online', majReseau)
      window.removeEventListener('offline', majReseau)
      navigator.serviceWorker?.removeEventListener('message', surMessage)
    }
  }, [])

  if (!enLigne) {
    return (
      <span className="etat-hors-ligne etat-hors-ligne--pret" title="Aucune connexion nécessaire">
        Hors ligne
      </span>
    )
  }
  if (!progression) return null

  const termine = progression.faits >= progression.total
  return (
    <span
      className={`etat-hors-ligne ${termine ? 'etat-hors-ligne--pret' : ''}`}
      title="Mise en cache des pictogrammes pour un usage sans connexion"
    >
      {termine
        ? 'Disponible hors ligne'
        : `Préparation hors ligne ${progression.faits}/${progression.total}`}
    </span>
  )
}
