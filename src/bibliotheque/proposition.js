import { normaliser, rechercher } from './recherche.js'

/**
 * Proposition de pictogrammes à partir d'un mot générique.
 *
 * C'est le cœur de la liste de courses : l'accompagnant écrit « pomme »,
 * l'application propose le pictogramme correspondant. Aucun moteur nouveau —
 * `rechercher()` fait déjà le travail (normalisation NFD, correspondance
 * exacte puis préfixe, classement par score), on ne fait que garder la tête
 * du classement.
 *
 * Un mot d'une seule lettre ne propose rien : le temps de la deuxième frappe,
 * les résultats seraient de toute façon remplacés.
 */
export function proposer(pack, mot, nombre = 6) {
  if (normaliser(mot).length < 2) return []
  return rechercher(pack, { requete: mot }).slice(0, nombre)
}
