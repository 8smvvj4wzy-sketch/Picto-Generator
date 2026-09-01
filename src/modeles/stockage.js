import { copier, estSupportValide, nouvelId, VERSION_SCHEMA } from '../support/modeleSupport.js'

const CLE = 'picto-generator:modeles:v1'

/**
 * Bibliothèque de modèles enregistrés, en localStorage.
 * Aucune donnée nominative d'apprenant n'est censée y figurer : seuls les
 * supports (titres, libellés, pictogrammes) sont enregistrés.
 */

function enveloppeVide() {
  return { version: VERSION_SCHEMA, modeles: [] }
}

export function lireTout() {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return enveloppeVide()
    const valeur = JSON.parse(brut)
    if (!valeur || !Array.isArray(valeur.modeles)) return enveloppeVide()
    return {
      version: valeur.version ?? VERSION_SCHEMA,
      modeles: valeur.modeles.filter((m) => m && estSupportValide(m.support)),
    }
  } catch {
    return enveloppeVide()
  }
}

function ecrire(enveloppe) {
  try {
    localStorage.setItem(CLE, JSON.stringify(enveloppe))
    return true
  } catch {
    return false
  }
}

export function listerModeles() {
  return lireTout().modeles.sort((a, b) => (b.dateModif ?? 0) - (a.dateModif ?? 0))
}

/** Enregistre un support. Si `idExistant` est fourni, le modèle est écrasé. */
export function enregistrer(support, nom, idExistant = null) {
  const enveloppe = lireTout()
  const modele = {
    id: idExistant ?? nouvelId('m'),
    nom: nom?.trim() || support.titre?.trim() || 'Sans titre',
    dateModif: Date.now(),
    support: copier(support),
  }
  const rang = enveloppe.modeles.findIndex((m) => m.id === modele.id)
  if (rang >= 0) enveloppe.modeles[rang] = modele
  else enveloppe.modeles.push(modele)
  ecrire(enveloppe)
  return modele
}

export function supprimer(id) {
  const enveloppe = lireTout()
  enveloppe.modeles = enveloppe.modeles.filter((m) => m.id !== id)
  ecrire(enveloppe)
}

export function dupliquer(id) {
  const enveloppe = lireTout()
  const source = enveloppe.modeles.find((m) => m.id === id)
  if (!source) return null
  const copie = {
    ...copier(source),
    id: nouvelId('m'),
    nom: `${source.nom} (copie)`,
    dateModif: Date.now(),
  }
  enveloppe.modeles.push(copie)
  ecrire(enveloppe)
  return copie
}

/** Fusionne des modèles importés : les identifiants sont toujours ré-attribués. */
export function importerModeles(modeles) {
  const enveloppe = lireTout()
  const ajoutes = modeles.map((m) => ({
    id: nouvelId('m'),
    nom: m.nom || m.support?.titre || 'Modèle importé',
    dateModif: Date.now(),
    support: copier(m.support),
  }))
  enveloppe.modeles.push(...ajoutes)
  ecrire(enveloppe)
  return ajoutes.length
}
