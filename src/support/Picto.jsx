const BASE = import.meta.env.BASE_URL

/** URL du fichier d'un pictogramme du pack embarqué. */
export function urlPicto(fichier) {
  return `${BASE}pictos/${fichier}`
}

/**
 * Affichage d'un pictogramme du pack.
 * `picto` est soit une entrée de l'index, soit une référence { id, fichier }.
 */
export default function Picto({ picto, alt = '', classe = '' }) {
  if (!picto?.fichier) return null
  return (
    <img
      className={`picto ${classe}`}
      src={urlPicto(picto.fichier)}
      alt={alt}
      loading="lazy"
      decoding="async"
      draggable="false"
    />
  )
}
