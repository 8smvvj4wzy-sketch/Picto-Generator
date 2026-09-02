/**
 * Enregistrement du service worker.
 *
 * Uniquement en production : en développement, un cache agressif masquerait
 * les modifications de code. Le service worker met l'application en cache puis
 * précharge tout le pack de pictogrammes, ce qui permet d'installer
 * l'application sur les tablettes et de l'utiliser wifi coupé.
 */
export function enregistrerServiceWorker() {
  if (!import.meta.env.PROD) return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', async () => {
    const base = import.meta.env.BASE_URL
    try {
      await navigator.serviceWorker.register(`${base}sw.js`, { scope: base })
    } catch (erreur) {
      console.warn('Service worker non enregistré :', erreur.message)
      return
    }

    // Demande le préchargement du pack : au premier chargement, mais aussi
    // à chaque retour du réseau, pour rattraper une visite faite hors ligne.
    const demanderPrechargement = async () => {
      const enregistrement = await navigator.serviceWorker.ready
      enregistrement.active?.postMessage({ type: 'precharger-pack' })
    }
    demanderPrechargement()
    window.addEventListener('online', demanderPrechargement)
  })
}
