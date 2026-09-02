import { estSupportValide, VERSION_SCHEMA } from '../support/modeleSupport.js'

const SIGNATURE = 'picto-generator'

/**
 * Échange de modèles entre collègues.
 *
 * Les pictogrammes étant embarqués dans l'application, un fichier JSON de
 * quelques kilo-octets suffit : il ne contient que des identifiants et des
 * libellés, jamais d'images.
 */

function telecharger(nomFichier, contenu) {
  const blob = new Blob([contenu], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  document.body.append(lien)
  lien.click()
  lien.remove()
  URL.revokeObjectURL(url)
}

function nomSur(texte) {
  return (
    (texte || 'modeles')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'modeles'
  )
}

export function exporterModeles(modeles, nomBase) {
  const paquet = {
    application: SIGNATURE,
    version: VERSION_SCHEMA,
    exporteLe: new Date().toISOString(),
    modeles: modeles.map((m) => ({ nom: m.nom, support: m.support })),
  }
  telecharger(`${nomSur(nomBase)}.json`, JSON.stringify(paquet, null, 2))
}

/**
 * Analyse un fichier importé.
 * Accepte le format d'export, mais aussi un support seul — c'est ce qu'un
 * collègue est susceptible de copier-coller.
 * @returns {{modeles: Array}|{erreur: string}}
 */
export function analyserImport(texte) {
  let donnees
  try {
    donnees = JSON.parse(texte)
  } catch {
    return { erreur: 'Fichier illisible : ce n’est pas du JSON valide.' }
  }

  if (estSupportValide(donnees)) {
    return { modeles: [{ nom: donnees.titre, support: donnees }] }
  }

  if (!donnees || !Array.isArray(donnees.modeles)) {
    return { erreur: 'Fichier non reconnu : aucun modèle à l’intérieur.' }
  }

  const modeles = donnees.modeles.filter((m) => m && estSupportValide(m.support))
  if (modeles.length === 0) {
    return { erreur: 'Aucun modèle exploitable dans ce fichier.' }
  }
  return { modeles }
}

export function lireFichier(fichier) {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resoudre(String(lecteur.result))
    lecteur.onerror = () => rejeter(lecteur.error)
    lecteur.readAsText(fichier)
  })
}
