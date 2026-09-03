import { useEffect, useRef, useState } from 'react'

const A4_MM = { portrait: [210, 297], paysage: [297, 210] }
const MM_EN_PX = 96 / 25.4

/**
 * Met la page A4 à l'échelle pour qu'elle tienne dans l'espace disponible.
 *
 * La mise à l'échelle est portée par une variable CSS consommée uniquement
 * dans un bloc `@media screen` : à l'impression, la page repart à sa taille
 * réelle. C'est ce qui permet d'avoir un aperçu confortable sans jamais
 * dévier du rendu papier.
 */
export default function ApercuMisEchelle({ paysage, children }) {
  const conteneur = useRef(null)
  const [echelle, setEchelle] = useState(1)

  useEffect(() => {
    const element = conteneur.current
    if (!element) return undefined

    const [largeurMm, hauteurMm] = A4_MM[paysage ? 'paysage' : 'portrait']
    const largeurPage = largeurMm * MM_EN_PX
    const hauteurPage = hauteurMm * MM_EN_PX

    // La page entière doit tenir dans le cadre : la largeur ne suffit pas,
    // sinon le bas du support sort de l'écran et l'aperçu perd son intérêt.
    function recalculer() {
      const largeurDisponible = element.clientWidth - 24
      // Hauteur du cadre lui-même : elle tient compte de ce qu'un support
      // ajoute éventuellement sous la feuille (bande d'images proposées).
      const hauteurDisponible =
        (element.clientHeight || element.parentElement?.clientHeight || window.innerHeight) - 40
      const voulue = Math.min(largeurDisponible / largeurPage, hauteurDisponible / hauteurPage)
      setEchelle(Math.min(1, Math.max(0.2, voulue)))
    }

    recalculer()
    const observateur = new ResizeObserver(recalculer)
    observateur.observe(element)
    if (element.parentElement) observateur.observe(element.parentElement)
    return () => observateur.disconnect()
  }, [paysage])

  return (
    <div className="apercu" ref={conteneur}>
      <div
        className="apercu__cadre"
        style={{
          '--echelle': echelle,
          '--largeur-page': paysage ? '297mm' : '210mm',
          '--hauteur-page': paysage ? '210mm' : '297mm',
        }}
      >
        {children}
      </div>
    </div>
  )
}
