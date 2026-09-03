const BASE = import.meta.env.BASE_URL

/** URL du fichier d'un pictogramme du pack embarqué. */
export function urlPicto(fichier) {
  return `${BASE}pictos/${fichier}`
}

/**
 * Affichage d'un pictogramme.
 *
 * `picto` est soit une entrée de l'index, soit une référence { id, fichier },
 * soit une image personnelle qui porte son contenu dans `dataURL` — celle-ci
 * n'existant dans aucun pack, elle ne peut pas être désignée par un fichier.
 */
export default function Picto({ picto, alt = '', classe = '' }) {
  const source = picto?.dataURL ?? (picto?.fichier ? urlPicto(picto.fichier) : null)
  if (!source) return null
  return (
    <img
      className={`picto ${classe}`}
      src={source}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable="false"
    />
  )
}
