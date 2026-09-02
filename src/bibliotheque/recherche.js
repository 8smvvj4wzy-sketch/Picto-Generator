/**
 * Recherche dans le pack de pictogrammes.
 *
 * Tout tient en mémoire (400 à 600 entrées) : il n'y a ni requête réseau ni
 * délai d'attente, le filtrage se fait à chaque frappe. La normalisation NFD
 * est appliquée des deux côtés — index et saisie — pour que « laver » trouve
 * « se laver » et que « fatigue » trouve « fatigué ».
 */

/** Minuscules, sans accents, sans ponctuation superflue. */
export function normaliser(texte) {
  return (texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Prépare une entrée de l'index : la normalisation n'est faite qu'une fois. */
export function preparer(entree) {
  return {
    ...entree,
    motsClesNormalises: (entree.motsCles ?? []).map(normaliser),
    categorieNormalisee: normaliser(entree.categorie),
    libelle: entree.motsCles?.[0] ?? String(entree.id),
  }
}

/**
 * Score d'une entrée pour un mot de la requête.
 * 0 = ne correspond pas ; plus le score est haut, meilleure est la place.
 */
function scoreMot(entree, mot) {
  let meilleur = 0
  for (const cle of entree.motsClesNormalises) {
    if (cle === mot) return 100
    if (cle.startsWith(mot)) meilleur = Math.max(meilleur, 60)
    else if (cle.includes(` ${mot}`)) meilleur = Math.max(meilleur, 40)
    else if (cle.includes(mot)) meilleur = Math.max(meilleur, 20)
  }
  if (meilleur === 0 && entree.categorieNormalisee.includes(mot)) meilleur = 10
  return meilleur
}

/**
 * Filtre et classe le pack.
 * Tous les mots de la requête doivent correspondre (recherche conjonctive) ;
 * les favoris remontent en tête à score égal.
 */
export function rechercher(pack, { requete = '', categorie = null, favoris = [] } = {}) {
  const mots = normaliser(requete).split(' ').filter(Boolean)
  const estFavori = new Set(favoris)

  const resultats = []
  for (const entree of pack) {
    if (categorie && entree.categorie !== categorie) continue

    let score = 0
    if (mots.length > 0) {
      let total = 0
      for (const mot of mots) {
        const s = scoreMot(entree, mot)
        if (s === 0) {
          total = 0
          break
        }
        total += s
      }
      if (total === 0) continue
      score = total / mots.length
    }
    resultats.push({ entree, score })
  }

  resultats.sort((a, b) => {
    const favA = estFavori.has(a.entree.id) ? 1 : 0
    const favB = estFavori.has(b.entree.id) ? 1 : 0
    if (favA !== favB) return favB - favA
    if (b.score !== a.score) return b.score - a.score
    return a.entree.libelle.localeCompare(b.entree.libelle, 'fr')
  })

  return resultats.map((r) => r.entree)
}
