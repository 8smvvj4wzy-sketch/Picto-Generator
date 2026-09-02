/* eslint-env serviceworker */
/**
 * Service worker de l'application.
 *
 * Objectif : le critère d'acceptation n° 1 du cahier des charges — l'application
 * se charge et fonctionne intégralement wifi coupé.
 *
 * Deux caches :
 *   - « coquille » : HTML, JS, CSS, manifeste, icône
 *   - « pack »     : les pictogrammes, préchargés en tâche de fond à
 *                    l'activation puis conservés d'une version à l'autre
 */

const VERSION = 'v1'
const CACHE_COQUILLE = `picto-coquille-${VERSION}`
const CACHE_PACK = 'picto-pack'

const BASE = new URL('./', self.location).pathname

const COQUILLE = [BASE, `${BASE}index.html`, `${BASE}manifest.webmanifest`, `${BASE}icone.svg`]

self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE_COQUILLE)
      .then((cache) => cache.addAll(COQUILLE))
      .catch(() => undefined) // hors ligne dès la première visite : on n'échoue pas
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    (async () => {
      const noms = await caches.keys()
      await Promise.all(
        noms
          .filter((nom) => nom.startsWith('picto-coquille-') && nom !== CACHE_COQUILLE)
          .map((nom) => caches.delete(nom)),
      )
      await self.clients.claim()
      prechargerPack() // sans await : l'application ne doit pas attendre
    })(),
  )
})

/** Prévient les onglets ouverts de l'avancement du préchargement. */
async function annoncer(message) {
  const clients = await self.clients.matchAll({ type: 'window' })
  for (const client of clients) client.postMessage(message)
}

/**
 * Met tout le pack de pictogrammes en cache.
 * Les fichiers déjà présents sont sautés : un rechargement ne coûte rien.
 */
let prechargementEnCours = false

async function prechargerPack() {
  if (prechargementEnCours) return
  prechargementEnCours = true
  try {
    const reponse = await fetch(`${BASE}pictos/index.json`, { cache: 'no-cache' })
    if (!reponse.ok) return

    // La copie doit être faite AVANT la lecture du corps : une réponse déjà lue
    // ne peut plus être clonée ni mise en cache.
    const cache = await caches.open(CACHE_PACK)
    await cache.put(`${BASE}pictos/index.json`, reponse.clone())

    const index = await reponse.json()
    if (!Array.isArray(index) || index.length === 0) return

    let faits = 0
    const total = index.length
    const file = [...index]

    const ouvriers = Array.from({ length: 6 }, async () => {
      for (;;) {
        const entree = file.shift()
        if (!entree) return
        const url = `${BASE}pictos/${entree.fichier}`
        try {
          if (!(await cache.match(url))) await cache.add(url)
        } catch {
          /* un pictogramme manquant ne doit pas interrompre le préchargement */
        }
        faits += 1
        if (faits % 25 === 0 || faits === total) await annoncer({ type: 'pack-hors-ligne', faits, total })
      }
    })
    await annoncer({ type: 'pack-hors-ligne', faits: 0, total })
    await Promise.all(ouvriers)
  } catch {
    /* pas de réseau : le préchargement reprendra au prochain retour en ligne */
  } finally {
    prechargementEnCours = false
  }
}

// L'application redemande un préchargement au chargement et au retour du
// réseau : sans cela, une première visite hors ligne condamnerait le pack
// jusqu'à la prochaine activation du service worker.
self.addEventListener('message', (evenement) => {
  if (evenement.data?.type === 'precharger-pack') evenement.waitUntil(prechargerPack())
})

/** Cache d'abord : une fois le fichier connu, plus aucune requête réseau. */
async function cacheDAbord(requete, nomCache) {
  const cache = await caches.open(nomCache)
  const enCache = await cache.match(requete)
  if (enCache) return enCache
  const reponse = await fetch(requete)
  if (reponse.ok) cache.put(requete, reponse.clone())
  return reponse
}

/** Cache d'abord, mais rafraîchi en tâche de fond quand le réseau est là. */
async function cacheEtRafraichissement(requete, nomCache) {
  const cache = await caches.open(nomCache)
  const enCache = await cache.match(requete)
  const reseau = fetch(requete)
    .then((reponse) => {
      if (reponse.ok) cache.put(requete, reponse.clone())
      return reponse
    })
    .catch(() => enCache ?? Response.error())
  return enCache ?? reseau
}

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request
  if (requete.method !== 'GET') return

  const url = new URL(requete.url)
  if (url.origin !== self.location.origin) return

  // Navigation : réseau d'abord pour récupérer les mises à jour, page en cache
  // en secours — c'est ce qui rend l'application utilisable wifi coupé.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete).catch(async () => {
        const cache = await caches.open(CACHE_COQUILLE)
        return (await cache.match(`${BASE}index.html`)) ?? (await cache.match(BASE)) ?? Response.error()
      }),
    )
    return
  }

  if (url.pathname.startsWith(`${BASE}pictos/`)) {
    evenement.respondWith(
      url.pathname.endsWith('index.json')
        ? cacheEtRafraichissement(requete, CACHE_PACK)
        : cacheDAbord(requete, CACHE_PACK),
    )
    return
  }

  evenement.respondWith(cacheEtRafraichissement(requete, CACHE_COQUILLE))
})
