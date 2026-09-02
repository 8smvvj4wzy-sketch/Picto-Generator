import { useCallback, useEffect, useState } from 'react'

const CLE = 'picto-generator:favoris:v1'

function lire() {
  try {
    const brut = localStorage.getItem(CLE)
    const valeur = brut ? JSON.parse(brut) : []
    return Array.isArray(valeur) ? valeur.filter((id) => typeof id === 'number') : []
  } catch {
    return []
  }
}

/** Favoris de pictogrammes, conservés en localStorage (aucune donnée nominative). */
export function useFavoris() {
  const [favoris, setFavoris] = useState(lire)

  useEffect(() => {
    try {
      localStorage.setItem(CLE, JSON.stringify(favoris))
    } catch {
      /* navigation privée ou quota atteint : les favoris restent en mémoire */
    }
  }, [favoris])

  const basculer = useCallback((id) => {
    setFavoris((actuels) =>
      actuels.includes(id) ? actuels.filter((x) => x !== id) : [...actuels, id],
    )
  }, [])

  return { favoris, basculer }
}
