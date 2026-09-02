import Picto from '../support/Picto.jsx'
import { caseVide, TYPES } from '../support/modeleSupport.js'
import { ChampNombre, ChampTexte, ChoixSegmente, Ligne } from '../support/controles.jsx'

/** Emplacement vide destiné au collage d'un jeton plastifié — jamais rempli. */
function Emplacement({ forme }) {
  const commun = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeDasharray: '7 5',
    vectorEffect: 'non-scaling-stroke',
  }
  return (
    <svg className="jeton" viewBox="0 0 100 100" role="img" aria-label="Emplacement de jeton">
      {forme === 'rond' && <circle cx="50" cy="50" r="44" {...commun} />}
      {forme === 'carre' && <rect x="8" y="8" width="84" height="84" rx="8" {...commun} />}
      {forme === 'etoile' && (
        <polygon
          points="50,6 61,38 95,38 68,58 78,92 50,71 22,92 32,58 5,38 39,38"
          {...commun}
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

/**
 * Nombre de colonnes de la grille de jetons.
 * Le renforçateur placé à droite laisse peu de largeur : on limite alors à
 * trois colonnes pour que les emplacements restent assez grands pour un jeton.
 */
function colonnesJetons({ nbJetons, positionRenforcateur }) {
  const maximum = positionRenforcateur === 'droite' ? 3 : 5
  return Math.min(nbJetons, maximum)
}

function defaut() {
  return {
    type: TYPES.JETONS,
    titre: 'Tableau de jetons',
    orientation: 'portrait',
    taillePicto: 'grand',
    contraste: 'couleur',
    nbJetons: 5,
    formeJeton: 'rond',
    positionRenforcateur: 'droite',
    comportement: 'Je lève la main pour demander',
    // Le renforçateur est la seule « case » du support : il se remplit depuis
    // la Bibliothèque exactement comme les cases des deux autres éditeurs.
    cases: [caseVide()],
  }
}

function Reglages({ support, modifier }) {
  return (
    <>
      <Ligne label="Comportement cible" aide="Affiché en en-tête du tableau">
        <ChampTexte
          valeur={support.comportement}
          onChange={(v) => modifier({ comportement: v })}
          placeholder="Je lève la main pour demander"
        />
      </Ligne>

      <Ligne label="Nombre de jetons" aide="1 à 10">
        <ChampNombre
          valeur={support.nbJetons}
          min={1}
          max={10}
          onChange={(n) => modifier({ nbJetons: n })}
        />
      </Ligne>

      <Ligne label="Forme du jeton">
        <ChoixSegmente
          nom="Forme du jeton"
          valeur={support.formeJeton}
          onChange={(v) => modifier({ formeJeton: v })}
          options={[
            { valeur: 'rond', libelle: 'Rond' },
            { valeur: 'etoile', libelle: 'Étoile' },
            { valeur: 'carre', libelle: 'Carré' },
          ]}
        />
      </Ligne>

      <Ligne label="Renforçateur">
        <ChoixSegmente
          nom="Position du renforçateur"
          valeur={support.positionRenforcateur}
          onChange={(v) => modifier({ positionRenforcateur: v })}
          options={[
            { valeur: 'droite', libelle: 'À droite' },
            { valeur: 'bas', libelle: 'En bas' },
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
    </>
  )
}

function Rendu({ support, selection, onSelectionner, onModifierCase }) {
  const renforcateur = support.cases[0]

  return (
    <div className={`jetons jetons--${support.positionRenforcateur}`}>
      <div className="jetons__entete">
        <input
          className="jetons__comportement"
          value={support.comportement}
          placeholder="Comportement cible"
          readOnly
          tabIndex={-1}
          aria-label="Comportement cible"
        />
      </div>

      <div className="jetons__corps">
        <div
          className="jetons__grille"
          style={{ gridTemplateColumns: `repeat(${colonnesJetons(support)}, 1fr)` }}
        >
          {Array.from({ length: support.nbJetons }, (_, i) => (
            <div className="jetons__emplacement" key={i}>
              <Emplacement forme={support.formeJeton} />
            </div>
          ))}
        </div>

        <div
          className={`jetons__renforcateur ${selection === 0 ? 'case--selectionnee' : ''}`}
          onMouseDown={() => onSelectionner(0)}
        >
          <span className="jetons__recompense">Ensuite&nbsp;:</span>
          <div className="case__picto">
            {renforcateur?.picto ? (
              <Picto picto={renforcateur.picto} alt={renforcateur.libelle} />
            ) : (
              <span className="case__vide sans-impression">Choisir un pictogramme</span>
            )}
          </div>
          <input
            className="case__libelle"
            value={renforcateur?.libelle ?? ''}
            placeholder="Renforçateur"
            onChange={(e) => onModifierCase(0, { libelle: e.target.value })}
            aria-label="Libellé du renforçateur"
          />
        </div>
      </div>
    </div>
  )
}

export default {
  id: TYPES.JETONS,
  nom: 'Tableau de jetons',
  description: 'Emplacements vides à coller, 1 à 10 jetons, picto du renforçateur.',
  defaut,
  Reglages,
  Rendu,
}
