/** Petits contrôles partagés par les panneaux de réglages des trois éditeurs. */

export function Ligne({ label, children, aide }) {
  return (
    <div className="reglage">
      <span className="reglage__label">{label}</span>
      <div className="reglage__champ">{children}</div>
      {aide ? <span className="reglage__aide">{aide}</span> : null}
    </div>
  )
}

export function ChampTexte({ valeur, onChange, ...reste }) {
  return (
    <input
      type="text"
      className="champ"
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      {...reste}
    />
  )
}

/** Choix exclusif sous forme de boutons collés — plus rapide qu'un menu déroulant. */
export function ChoixSegmente({ valeur, options, onChange, nom }) {
  return (
    <div className="segmente" role="radiogroup" aria-label={nom}>
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          role="radio"
          aria-checked={valeur === o.valeur}
          className={`segmente__option ${valeur === o.valeur ? 'segmente__option--active' : ''}`}
          onClick={() => onChange(o.valeur)}
          title={o.aide}
        >
          {o.libelle}
        </button>
      ))}
    </div>
  )
}

export function ChampNombre({ valeur, min, max, onChange }) {
  return (
    <div className="nombre">
      <input
        type="range"
        min={min}
        max={max}
        value={valeur}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Valeur entre ${min} et ${max}`}
      />
      <output className="nombre__valeur">{valeur}</output>
    </div>
  )
}

export function Interrupteur({ valeur, onChange, label }) {
  return (
    <label className="interrupteur">
      <input type="checkbox" checked={valeur} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}
