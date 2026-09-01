import Picto from '../support/Picto.jsx'
import { ajusterNombre, casesVides, TYPES } from '../support/modeleSupport.js'
import { ChampNombre, ChoixSegmente, Interrupteur, Ligne } from '../support/controles.jsx'

/** Nombre de colonnes de la disposition « grille », selon le nombre de cases. */
function colonnesGrille(nombre) {
  if (nombre <= 4) return 2
  if (nombre <= 9) return 3
  return 4
}

function defaut() {
  return {
    type: TYPES.EMPLOI_DU_TEMPS,
    titre: 'Mon emploi du temps',
    orientation: 'portrait',
    disposition: 'verticale',
    taillePicto: 'moyen',
    contraste: 'couleur',
    afficherHeures: false,
    afficherCasesACocher: false,
    cases: casesVides(6),
  }
}

function Reglages({ support, modifier }) {
  return (
    <>
      <Ligne label="Disposition">
        <ChoixSegmente
          nom="Disposition"
          valeur={support.disposition}
          onChange={(v) => modifier({ disposition: v })}
          options={[
            { valeur: 'verticale', libelle: 'Bande verticale' },
            { valeur: 'horizontale', libelle: 'Bande horizontale' },
            { valeur: 'grille', libelle: 'Grille' },
          ]}
        />
      </Ligne>

      <Ligne label="Nombre de cases" aide="2 à 12">
        <ChampNombre
          valeur={support.cases.length}
          min={2}
          max={12}
          onChange={(n) => modifier({ cases: ajusterNombre(support.cases, n) })}
        />
      </Ligne>

      <Ligne label="Taille des pictogrammes">
        <ChoixSegmente
          nom="Taille des pictogrammes"
          valeur={support.taillePicto}
          onChange={(v) => modifier({ taillePicto: v })}
          options={[
            { valeur: 'petit', libelle: 'Petit' },
            { valeur: 'moyen', libelle: 'Moyen' },
            { valeur: 'grand', libelle: 'Grand' },
          ]}
        />
      </Ligne>

      <Ligne label="Contraste" aide="Le noir et blanc économise l’encre">
        <ChoixSegmente
          nom="Contraste"
          valeur={support.contraste}
          onChange={(v) => modifier({ contraste: v })}
          options={[
            { valeur: 'couleur', libelle: 'Couleur' },
            { valeur: 'nb', libelle: 'Noir et blanc' },
          ]}
        />
      </Ligne>

      <Ligne label="Options">
        <Interrupteur
          label="Afficher une heure par case"
          valeur={support.afficherHeures}
          onChange={(v) => modifier({ afficherHeures: v })}
        />
        <Interrupteur
          label="Case à cocher « fait »"
          valeur={support.afficherCasesACocher}
          onChange={(v) => modifier({ afficherCasesACocher: v })}
        />
      </Ligne>
    </>
  )
}

function Rendu({ support, selection, onSelectionner, onModifierCase }) {
  const { disposition, cases } = support
  const style =
    disposition === 'grille'
      ? { gridTemplateColumns: `repeat(${colonnesGrille(cases.length)}, 1fr)` }
      : undefined

  return (
    <div className={`emploi emploi--${disposition}`} style={style}>
      {cases.map((c, index) => (
        <div
          key={c.id}
          className={`case ${selection === index ? 'case--selectionnee' : ''}`}
          onMouseDown={() => onSelectionner(index)}
        >
          {support.afficherHeures && (
            <input
              className="case__heure"
              value={c.heure}
              placeholder="9h30"
              onChange={(e) => onModifierCase(index, { heure: e.target.value })}
              aria-label={`Heure de la case ${index + 1}`}
            />
          )}

          <div className="case__picto">
            {c.picto ? (
              <Picto picto={c.picto} alt={c.libelle} />
            ) : (
              <span className="case__vide sans-impression">Choisir un pictogramme</span>
            )}
          </div>

          <input
            className="case__libelle"
            value={c.libelle}
            placeholder="Libellé"
            onChange={(e) => onModifierCase(index, { libelle: e.target.value })}
            aria-label={`Libellé de la case ${index + 1}`}
          />

          {support.afficherCasesACocher && <span className="case__coche" aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

export default {
  id: TYPES.EMPLOI_DU_TEMPS,
  nom: 'Emploi du temps',
  description: 'Bande ou grille de 2 à 12 cases : pictogramme, libellé, heure.',
  defaut,
  Reglages,
  Rendu,
}
