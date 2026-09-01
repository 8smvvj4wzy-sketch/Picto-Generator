import { useEffect, useState } from 'react'

const BASE = import.meta.env.BASE_URL
const URL_LOGO = `${BASE}logo-arasaac.png`

/**
 * Pied de page d'attribution ARASAAC.
 *
 * Les pictogrammes ARASAAC sont diffusés sous licence CC BY-NC-SA :
 * l'attribution est obligatoire sur chaque support imprimé. Ce composant ne
 * prend donc AUCUNE propriété permettant de le masquer ou d'en changer le
 * texte, et il est rendu par PageA4 pour tous les supports sans exception.
 */
export default function PiedDePage() {
  const [logoDisponible, setLogoDisponible] = useState(true)

  useEffect(() => {
    // Le logo est déposé par scripts/build-pictos.mjs en même temps que le pack.
    // Tant qu'il est absent, seule la mention textuelle est affichée.
    let annule = false
    const image = new Image()
    image.onload = () => !annule && setLogoDisponible(true)
    image.onerror = () => !annule && setLogoDisponible(false)
    image.src = URL_LOGO
    return () => {
      annule = true
    }
  }, [])

  return (
    <footer className="attribution">
      {logoDisponible && <img className="attribution__logo" src={URL_LOGO} alt="ARASAAC" />}
      <span className="attribution__texte">
        © ARASAAC — Gouvernement d’Aragon (auteur : Sergio Palao)
      </span>
    </footer>
  )
}
