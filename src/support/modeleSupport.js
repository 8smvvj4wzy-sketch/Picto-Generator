/**
 * Modèle de données d'un support.
 *
 * Un support est un objet JSON simple, sans classe ni référence circulaire :
 * il est enregistrable tel quel en localStorage et exportable en JSON pour être
 * partagé entre collègues. Les pictogrammes n'y sont référencés que par leur
 * identifiant et leur nom de fichier — le pack étant embarqué dans
 * l'application, un fichier JSON léger suffit.
 */

export const VERSION_SCHEMA = 1

export const TYPES = {
  EMPLOI_DU_TEMPS: 'emploi-du-temps',
  SEQUENTIEL: 'sequentiel',
  JETONS: 'jetons',
  LISTE_COURSES: 'liste-courses',
}

let compteur = 0
/** Identifiant local, unique le temps de la session (pas de dépendance uuid). */
export function nouvelId(prefixe = 'c') {
  compteur += 1
  return `${prefixe}${Date.now().toString(36)}${compteur.toString(36)}`
}

/**
 * Une case vide : pas de pictogramme, pas de libellé.
 *
 * `quantite` ne sert qu'à la liste de courses ; les trois autres éditeurs
 * l'ignorent, ce qui permet de partager sans condition `casesVides()`,
 * `ajusterNombre()` et le remplissage depuis la Bibliothèque.
 */
export function caseVide() {
  return { id: nouvelId(), picto: null, libelle: '', heure: '', quantite: 1 }
}

export function casesVides(nombre) {
  return Array.from({ length: nombre }, () => caseVide())
}

/**
 * Référence de pictogramme stockée dans un support.
 * On conserve le fichier pour que le rendu ne dépende pas de l'index chargé.
 * Une image personnelle n'existant dans aucun pack, son contenu est embarqué
 * dans la référence : le support reste imprimable et exportable tel quel.
 */
export function referencePicto(picto) {
  if (!picto) return null
  if (picto.dataURL) return { id: picto.id, fichier: null, dataURL: picto.dataURL }
  return { id: picto.id, fichier: picto.fichier }
}

/** Ajuste la longueur d'une liste de cases sans perdre les cases remplies. */
export function ajusterNombre(cases, nombre) {
  if (nombre === cases.length) return cases
  if (nombre < cases.length) return cases.slice(0, nombre)
  return [...cases, ...casesVides(nombre - cases.length)]
}

/**
 * Insère une case vide après `apres` (par défaut en fin de liste).
 * Une liste de courses se construit article par article, contrairement aux
 * autres supports dont le nombre de cases est un réglage.
 */
export function ajouterCase(cases, apres = cases.length - 1) {
  const rang = Math.min(Math.max(apres, -1), cases.length - 1) + 1
  return [...cases.slice(0, rang), caseVide(), ...cases.slice(rang)]
}

/** Retire une case ; une liste ne descend jamais en dessous d'une case. */
export function retirerCase(cases, index) {
  if (cases.length <= 1) return cases
  return cases.filter((_, i) => i !== index)
}

/** Copie profonde d'un support (structures JSON uniquement). */
export function copier(support) {
  return JSON.parse(JSON.stringify(support))
}

/**
 * Vérifie qu'un objet ressemble à un support exploitable.
 * Utilisé à l'import JSON et à la relecture du localStorage.
 */
export function estSupportValide(valeur) {
  return (
    valeur !== null &&
    typeof valeur === 'object' &&
    typeof valeur.type === 'string' &&
    Object.values(TYPES).includes(valeur.type) &&
    typeof valeur.titre === 'string'
  )
}
