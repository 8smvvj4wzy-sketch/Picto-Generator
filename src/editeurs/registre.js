import emploiDuTemps from './EmploiDuTemps.jsx'
import sequentiel from './Sequentiel.jsx'
import tableauJetons from './TableauJetons.jsx'

/**
 * Registre des éditeurs.
 *
 * L'application ne connaît que ce tableau : chaque éditeur fournit son état par
 * défaut, son panneau de réglages et son rendu A4. Ajouter un quatrième support
 * (planche PECS, carte de choix…) revient à ajouter une entrée ici.
 */
export const EDITEURS = [emploiDuTemps, sequentiel, tableauJetons]

export function editeurPour(type) {
  return EDITEURS.find((e) => e.id === type) ?? EDITEURS[0]
}
