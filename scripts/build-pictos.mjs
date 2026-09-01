#!/usr/bin/env node
/**
 * Constitution du pack de pictogrammes ARASAAC embarqué dans l'application.
 *
 *   npm run build:pictos
 *
 * Le script est exécuté une seule fois (ou à la demande, quand on enrichit
 * scripts/vocabulaire.json). Il n'est jamais appelé par l'application : celle-ci
 * ne lit que les fichiers déposés dans public/pictos/.
 *
 * Étapes :
 *   1. lecture de scripts/vocabulaire.json (catégorie -> mots-clés)
 *   2. recherche de chaque mot-clé sur l'API publique ARASAAC, en français
 *   3. déduplication par identifiant de pictogramme
 *   4. téléchargement de l'image dans public/pictos/<id>.<ext>
 *   5. écriture de public/pictos/index.json
 *
 * Options :
 *   --par-mot=3        pictogrammes retenus par mot-clé
 *   --max=600          plafond de pictogrammes dans le pack
 *   --langue=fr        langue de recherche ARASAAC
 *   --format=auto      auto | svg | png  (auto : SVG si disponible, sinon PNG)
 *   --concurrence=4    téléchargements simultanés
 *   --force            retélécharge les fichiers déjà présents
 *   --dry-run          n'écrit rien sur le disque
 *
 * Licence : les pictogrammes sont la propriété du Gouvernement d'Aragon,
 * créés par Sergio Palao pour ARASAAC, diffusés sous CC BY-NC-SA.
 */

import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FICHIER_VOCABULAIRE = path.join(RACINE, 'scripts', 'vocabulaire.json')
const DOSSIER_SORTIE = path.join(RACINE, 'public', 'pictos')
const FICHIER_INDEX = path.join(DOSSIER_SORTIE, 'index.json')

const API = 'https://api.arasaac.org/api'
const STATIQUE = 'https://static.arasaac.org/pictograms'

/* ------------------------------------------------------------------ options */

function lireOptions(argv) {
  const o = {
    parMot: 3,
    max: 600,
    langue: 'fr',
    format: 'auto',
    concurrence: 4,
    force: false,
    dryRun: false,
  }
  for (const arg of argv) {
    const [cle, valeur] = arg.replace(/^--/, '').split('=')
    switch (cle) {
      case 'par-mot': o.parMot = Number(valeur); break
      case 'max': o.max = Number(valeur); break
      case 'langue': o.langue = valeur; break
      case 'format': o.format = valeur; break
      case 'concurrence': o.concurrence = Number(valeur); break
      case 'force': o.force = true; break
      case 'dry-run': o.dryRun = true; break
      case 'help':
      case 'h': o.aide = true; break
      default:
        if (arg.startsWith('--')) console.warn(`  option inconnue ignorée : ${arg}`)
    }
  }
  if (!['auto', 'svg', 'png'].includes(o.format)) {
    throw new Error(`--format doit valoir auto, svg ou png (reçu : ${o.format})`)
  }
  return o
}

/* -------------------------------------------------------------------- outils */

const attendre = (ms) => new Promise((r) => setTimeout(r, ms))

/** Requête avec 3 tentatives et repli exponentiel (2 s, 4 s, 8 s). */
async function requete(url, { tentatives = 3, ...init } = {}) {
  let derniereErreur
  for (let essai = 0; essai < tentatives; essai += 1) {
    try {
      const reponse = await fetch(url, { redirect: 'follow', ...init })
      if (reponse.status === 404) return reponse // inutile de réessayer
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
      return reponse
    } catch (erreur) {
      derniereErreur = erreur
      if (essai < tentatives - 1) await attendre(2000 * 2 ** essai)
    }
  }
  throw new Error(`${url} — ${derniereErreur.message}`)
}

/** Exécute `tache` sur chaque élément, `limite` en parallèle. */
async function enParallele(elements, limite, tache) {
  const file = [...elements.entries()]
  const ouvriers = Array.from({ length: Math.max(1, limite) }, async () => {
    for (;;) {
      const suivant = file.shift()
      if (!suivant) return
      const [rang, element] = suivant
      await tache(element, rang)
    }
  })
  await Promise.all(ouvriers)
}

const octets = (n) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`

/* ------------------------------------------------------------------ ARASAAC */

/**
 * Recherche un mot-clé. L'API expose deux routes selon les versions ; on essaie
 * la route « search » puis la route « bestsearch », plus tolérante aux fautes.
 */
async function chercher(mot, langue) {
  const routes = [
    `${API}/pictograms/${langue}/search/${encodeURIComponent(mot)}`,
    `${API}/pictograms/${langue}/bestsearch/${encodeURIComponent(mot)}`,
  ]
  for (const url of routes) {
    const reponse = await requete(url)
    if (reponse.status === 404) continue
    const donnees = await reponse.json()
    if (Array.isArray(donnees) && donnees.length > 0) return donnees
  }
  return []
}

/**
 * ARASAAC a fait évoluer ses routes d'image au fil des versions et ne documente
 * pas le SVG de la même façon partout. Plutôt que de parier sur une URL, on
 * teste une échelle de candidats sur le premier pictogramme et on réutilise
 * ensuite le motif gagnant pour tout le pack.
 */
const CANDIDATS_SVG = [
  (id) => `${STATIQUE}/${id}/${id}_500.svg`,
  (id) => `${STATIQUE}/${id}/${id}.svg`,
  (id) => `${API}/pictograms/${id}?download=true&format=svg`,
  (id) => `${API}/pictograms/${id}/svg`,
]

const CANDIDATS_PNG = [
  (id) => `${STATIQUE}/${id}/${id}_500.png`,
  (id) => `${API}/pictograms/${id}?download=true&resolution=500`,
]

function estSvg(contenu, typeMime) {
  if (typeMime?.includes('svg')) return true
  const debut = Buffer.from(contenu.slice(0, 200)).toString('utf8').trimStart()
  return debut.startsWith('<svg') || debut.startsWith('<?xml')
}

function estPng(contenu, typeMime) {
  if (typeMime?.includes('png')) return true
  const t = new Uint8Array(contenu.slice(0, 4))
  return t[0] === 0x89 && t[1] === 0x50 && t[2] === 0x4e && t[3] === 0x47
}

/** Essaie les candidats et renvoie { motif, extension } du premier qui répond. */
async function detecterMotifImage(idExemple, format) {
  const echelle = []
  if (format === 'auto' || format === 'svg') {
    echelle.push(...CANDIDATS_SVG.map((f) => ({ construire: f, extension: 'svg', valide: estSvg })))
  }
  if (format === 'auto' || format === 'png') {
    echelle.push(...CANDIDATS_PNG.map((f) => ({ construire: f, extension: 'png', valide: estPng })))
  }

  for (const candidat of echelle) {
    const url = candidat.construire(idExemple)
    try {
      const reponse = await requete(url, { tentatives: 1 })
      if (reponse.status === 404) continue
      const contenu = await reponse.arrayBuffer()
      if (contenu.byteLength > 0 && candidat.valide(contenu, reponse.headers.get('content-type'))) {
        return { ...candidat, exemple: url }
      }
    } catch {
      /* candidat suivant */
    }
  }
  throw new Error(
    "aucune URL d'image ARASAAC n'a répondu.\n" +
      "  Vérifiez votre connexion, puis les motifs listés dans CANDIDATS_SVG / CANDIDATS_PNG\n" +
      '  en haut de scripts/build-pictos.mjs (les routes ARASAAC changent parfois).',
  )
}

/**
 * Logo ARASAAC pour le pied de page des supports imprimés.
 *
 * La licence CC BY-NC-SA impose l'attribution ; le cahier des charges demande
 * en plus le logo. Il n'est pas redistribué dans le dépôt tant que ce script
 * n'a pas été exécuté : sans lui, le pied de page se limite à la mention
 * textuelle, qui reste, elle, toujours affichée.
 */
const CANDIDATS_LOGO = [
  'https://static.arasaac.org/images/arasaac-logo.png',
  'https://static.arasaac.org/images/arasaac_logo.png',
  'https://arasaac.org/images/arasaac-logo.png',
]

async function telechargerLogo(dryRun) {
  const destination = path.join(RACINE, 'public', 'logo-arasaac.png')
  if (existsSync(destination)) return 'déjà présent'
  for (const url of CANDIDATS_LOGO) {
    try {
      const reponse = await requete(url, { tentatives: 1 })
      if (reponse.status === 404) continue
      const contenu = Buffer.from(await reponse.arrayBuffer())
      if (contenu.byteLength === 0) continue
      if (!dryRun) await writeFile(destination, contenu)
      return url
    } catch {
      /* candidat suivant */
    }
  }
  return null
}

/* ------------------------------------------------------------------ collecte */

/** Mots-clés français d'un pictogramme, tels que renvoyés par l'API. */
function motsClesDe(picto) {
  const bruts = Array.isArray(picto.keywords) ? picto.keywords : []
  return bruts
    .map((k) => (typeof k === 'string' ? k : k?.keyword))
    .filter((k) => typeof k === 'string' && k.trim().length > 0)
    .map((k) => k.trim())
}

class ApiInjoignable extends Error {}

async function collecter(vocabulaire, options) {
  /** @type {Map<number, {id:number, motsCles:Set<string>, categorie:string}>} */
  const pack = new Map()
  const sansResultat = []
  // Inutile d'attendre 200 mots-clés en échec pour conclure que l'API est
  // injoignable (pas de réseau, proxy d'entreprise, service en panne).
  let echecsConsecutifs = 0

  for (const [categorie, mots] of vocabulaire) {
    process.stdout.write(`\n  ${categorie} `)
    for (const mot of mots) {
      if (pack.size >= options.max) break
      let resultats = []
      try {
        resultats = await chercher(mot, options.langue)
        echecsConsecutifs = 0
      } catch (erreur) {
        console.warn(`\n    « ${mot} » : ${erreur.message}`)
        echecsConsecutifs += 1
        if (echecsConsecutifs >= 5 && pack.size === 0) {
          throw new ApiInjoignable(
            'api.arasaac.org ne répond pas (5 échecs de suite).\n' +
              '  Vérifiez votre connexion, un éventuel proxy, puis relancez.\n' +
              '  Les fichiers déjà téléchargés sont conservés : rien n’est perdu.',
          )
        }
      }
      if (resultats.length === 0) {
        sansResultat.push(mot)
        process.stdout.write('·')
        continue
      }
      for (const picto of resultats.slice(0, options.parMot)) {
        const id = picto._id ?? picto.id
        if (typeof id !== 'number') continue
        if (!pack.has(id)) {
          if (pack.size >= options.max) break
          // Le mot-clé recherché est toujours conservé en tête : c'est celui
          // que l'utilisateur tapera dans la Bibliothèque.
          pack.set(id, { id, motsCles: new Set([mot]), categorie })
        }
        const entree = pack.get(id)
        entree.motsCles.add(mot)
        for (const k of motsClesDe(picto)) entree.motsCles.add(k)
      }
      process.stdout.write('.')
    }
  }
  process.stdout.write('\n')
  return { pack, sansResultat }
}

const AIDE = `Constitution du pack de pictogrammes ARASAAC.

  node scripts/build-pictos.mjs [options]

  --par-mot=3      pictogrammes retenus par mot-clé
  --max=600        plafond de pictogrammes dans le pack
  --langue=fr      langue de recherche ARASAAC
  --format=auto    auto | svg | png  (auto : SVG si disponible, sinon PNG)
  --concurrence=4  téléchargements simultanés
  --force          retélécharge les fichiers déjà présents
  --dry-run        n'écrit rien sur le disque
  --help           affiche cette aide

  Sortie : public/pictos/<id>.<ext> et public/pictos/index.json`

/* --------------------------------------------------------------- programme */

async function principal() {
  const options = lireOptions(process.argv.slice(2))

  if (options.aide) {
    console.log(AIDE)
    return
  }

  const brut = JSON.parse(await readFile(FICHIER_VOCABULAIRE, 'utf8'))
  const vocabulaire = Object.entries(brut).filter(
    ([cle, valeur]) => !cle.startsWith('_') && Array.isArray(valeur),
  )
  const nbMots = vocabulaire.reduce((n, [, mots]) => n + mots.length, 0)

  console.log('Constitution du pack de pictogrammes ARASAAC')
  console.log(
    `  ${vocabulaire.length} catégories, ${nbMots} mots-clés, ` +
      `${options.parMot} pictogramme(s) par mot, plafond ${options.max}`,
  )
  if (options.dryRun) console.log('  mode --dry-run : aucune écriture sur le disque')

  console.log('\nRecherche sur api.arasaac.org…')
  const { pack, sansResultat } = await collecter(vocabulaire, options)

  if (pack.size === 0) {
    throw new Error(
      'aucun pictogramme trouvé — API injoignable ou vocabulaire vide. Rien n’a été écrit.',
    )
  }
  console.log(`  ${pack.size} pictogrammes distincts retenus`)

  const entrees = [...pack.values()]

  console.log("\nDétection du format d'image…")
  const motif = await detecterMotifImage(entrees[0].id, options.format)
  console.log(`  ${motif.extension.toUpperCase()} via ${motif.exemple}`)

  if (!options.dryRun) await mkdir(DOSSIER_SORTIE, { recursive: true })

  console.log('\nTéléchargement…')
  let telecharges = 0
  let reutilises = 0
  const echecs = []

  await enParallele(entrees, options.concurrence, async (entree, rang) => {
    const nomFichier = `${entree.id}.${motif.extension}`
    const destination = path.join(DOSSIER_SORTIE, nomFichier)
    entree.fichier = nomFichier

    if (!options.force && existsSync(destination)) {
      reutilises += 1
      entree.ok = true
      return
    }
    if (options.dryRun) {
      entree.ok = true
      return
    }
    try {
      const reponse = await requete(motif.construire(entree.id))
      if (reponse.status === 404) throw new Error('HTTP 404')
      const contenu = Buffer.from(await reponse.arrayBuffer())
      if (contenu.byteLength === 0) throw new Error('fichier vide')
      await writeFile(destination, contenu)
      telecharges += 1
      entree.ok = true
    } catch (erreur) {
      echecs.push(`${entree.id} — ${erreur.message}`)
      entree.ok = false
    }
    if ((rang + 1) % 25 === 0) process.stdout.write(`  ${rang + 1}/${entrees.length}\n`)
  })

  const retenues = entrees.filter((e) => e.ok)
  const index = retenues
    .map((e) => ({
      id: e.id,
      fichier: e.fichier,
      motsCles: [...e.motsCles],
      categorie: e.categorie,
    }))
    .sort((a, b) => a.id - b.id)

  if (!options.dryRun) {
    await writeFile(FICHIER_INDEX, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
  }

  console.log('\nLogo ARASAAC (pied de page des supports)…')
  const logo = await telechargerLogo(options.dryRun)
  console.log(
    logo
      ? `  ${logo}`
      : '  introuvable — le pied de page se limitera à la mention textuelle,\n' +
          '  qui suffit à l’attribution. Vous pouvez déposer le logo à la main\n' +
          '  dans public/logo-arasaac.png.',
  )

  /* ------------------------------------------------------------- rapport */

  let poids = 0
  if (!options.dryRun && existsSync(DOSSIER_SORTIE)) {
    for (const nom of await readdir(DOSSIER_SORTIE)) {
      poids += (await stat(path.join(DOSSIER_SORTIE, nom))).size
    }
  }

  console.log('\n─────────────────────────────────────────────')
  console.log(`  pictogrammes dans le pack : ${index.length}`)
  console.log(`  téléchargés               : ${telecharges}`)
  console.log(`  déjà présents             : ${reutilises}`)
  if (echecs.length) console.log(`  échecs                    : ${echecs.length}`)
  if (poids) console.log(`  poids de public/pictos    : ${octets(poids)}`)
  if (sansResultat.length) {
    console.log(`\n  ${sansResultat.length} mot(s)-clé(s) sans résultat ARASAAC :`)
    console.log(`  ${sansResultat.join(', ')}`)
    console.log('  (reformulez-les dans scripts/vocabulaire.json puis relancez)')
  }
  if (echecs.length) {
    console.log('\n  Images non téléchargées :')
    for (const e of echecs.slice(0, 20)) console.log(`    ${e}`)
    if (echecs.length > 20) console.log(`    … et ${echecs.length - 20} autres`)
  }
  if (index.length < 400) {
    console.log(
      '\n  Le cahier des charges vise 400 à 600 pictogrammes : ' +
        'augmentez --par-mot ou enrichissez scripts/vocabulaire.json.',
    )
  }
  console.log('\n  index.json écrit dans public/pictos/. Pensez à committer le pack.')
  console.log('  © ARASAAC — Gouvernement d’Aragon (auteur : Sergio Palao) — CC BY-NC-SA')
}

principal().catch((erreur) => {
  console.error(`\nÉchec : ${erreur.message}`)
  process.exitCode = 1
})
