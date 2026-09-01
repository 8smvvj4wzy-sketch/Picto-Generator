import Picto from '../support/Picto.jsx'
import { ajusterNombre, casesVides, TYPES } from '../support/modeleSupport.js'
import { ChampNombre, ChoixSegmente, Interrupteur, Ligne } from '../support/controles.jsx'

function defaut() {
  return {
    type: TYPES.SEQUENTIEL,
    titre: 'Se laver les mains',
    orientation: 'portrait',
    disposition: 'verticale',
    taillePicto: 'moyen',
    contraste: 'couleur',
    afficherNumeros: true,
    afficherCasesACocher: false,
    afficherFleches: true,
    cases: casesVides(4),
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
          ]}
        />
      </Ligne>

      <Ligne label="Nombre d’étapes" aide="Numérotées automatiquement">
        <ChampNombre
          valeur={support.cases.length}
          min={2}
          max={10}
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

      <Ligne label="Contraste">
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
          label="Numéros visibles"
          valeur={support.afficherNumeros}
          onChange={(v) => modifier({ afficherNumeros: v })}
        />
        <Interrupteur
          label="Flèches de liaison"
          valeur={support.afficherFleches}
          onChange={(v) => modifier({ afficherFleches: v })}
        />
        <Interrupteur
          label="Case à cocher par étape"
          valeur={support.afficherCasesACocher}
          onChange={(v) => modifier({ afficherCasesACocher: v })}
        />
      </Ligne>
    </>
  )
}

function Rendu({ support, selection, onSelectionner, onModifierCase }) {
  const { disposition, cases, afficherFleches } = support

  return (
    <div className={`sequentiel sequentiel--${disposition}`}>
      {cases.map((c, index) => (
        <div className="sequentiel__maillon" key={c.id}>
          <div
            className={`etape ${selection === index ? 'case--selectionnee' : ''}`}
            onMouseDown={() => onSelectionner(index)}
          >
            {support.afficherNumeros && <span className="etape__numero">{index + 1}</span>}

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
              placeholder={`Étape ${index + 1}`}
              onChange={(e) => onModifierCase(index, { libelle: e.target.value })}
              aria-label={`Libellé de l’étape ${index + 1}`}
            />

            {support.afficherCasesACocher && <span className="case__coche" aria-hidden="true" />}
          </div>

          {afficherFleches && index < cases.length - 1 && (
            <span className="sequentiel__fleche" aria-hidden="true">
              {disposition === 'verticale' ? '▼' : '▶'}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default {
  id: TYPES.SEQUENTIEL,
  nom: 'Séquentiel de tâche',
  description: 'Étapes numérotées automatiquement, reliées par des flèches.',
  defaut,
  Reglages,
  Rendu,
}
