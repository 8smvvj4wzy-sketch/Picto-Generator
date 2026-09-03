import { useCallback, useEffect, useState } from 'react'

const CLE = 'picto-generator:images:v1'
/** Côté maximal de l'image enregistrée : au-delà, l'impression ne gagne rien. */
const COTE_MAX = 400
/** Au-delà, le quota localStorage (5 Mo environ) devient risqué. */
const POIDS_MAX = 3_500_000

/**
 * Images personnelles.
 *
 * Le pack ARASAAC ne connaît ni la marque de yaourt du placard ni la boulangerie
 * du coin : une photo du produit réel est souvent plus parlante qu'un
 * pictogramme. Ces images sont réduites, ré-encodées, puis conservées en
 * localStorage sous la même forme qu'une entrée du pack — mots-clés compris.
 * Elles traversent donc la recherche, les filtres, les favoris et la
 * proposition automatique sans une ligne de code supplémentaire.
 *
 * Rien ne quitte l'appareil : ni téléversement, ni serveur.
 */

export function lireImages() {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const valeur = JSON.parse(brut)
    return Array.isArray(valeur) ? valeur.filter((i) => i?.id && i?.dataURL) : []
  } catch {
    return []
  }
}

function ecrireImages(images) {
  localStorage.setItem(CLE, JSON.stringify(images))
}

export function poidsImages(images) {
  return images.reduce((total, image) => total + image.dataURL.length, 0)
}

/**
 * Réduit une image à `COTE_MAX` et la ré-encode.
 * WebP quand le navigateur le produit, JPEG sinon : une photo de téléphone
 * passe ainsi de plusieurs mégaoctets à quelques dizaines de kilo-octets.
 */
export function reduireImage(fichier) {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      const facteur = Math.min(1, COTE_MAX / Math.max(image.width, image.height))
      const largeur = Math.max(1, Math.round(image.width * facteur))
      const hauteur = Math.max(1, Math.round(image.height * facteur))

      const toile = document.createElement('canvas')
      toile.width = largeur
      toile.height = hauteur
      const contexte = toile.getContext('2d')
      // Les photos sans transparence gagnent un fond blanc : sans cela, une
      // image à canal alpha s'imprime sur un aplat noir chez certains pilotes.
      contexte.fillStyle = '#ffffff'
      contexte.fillRect(0, 0, largeur, hauteur)
      contexte.drawImage(image, 0, 0, largeur, hauteur)

      const webp = toile.toDataURL('image/webp', 0.8)
      resoudre(webp.startsWith('data:image/webp') ? webp : toile.toDataURL('image/jpeg', 0.85))
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      rejeter(new Error('Image illisible.'))
    }

    image.src = url
  })
}

/**
 * Charge les images personnelles et expose l'ajout et la suppression.
 * L'état est partagé entre les composants par un événement de fenêtre :
 * ajouter une image depuis la Bibliothèque met aussi à jour le pack utilisé
 * par la proposition automatique.
 */
export function useMesImages() {
  const [images, setImages] = useState(lireImages)

  useEffect(() => {
    const relire = () => setImages(lireImages())
    window.addEventListener('mes-images-modifiees', relire)
    // Deuxième onglet ouvert sur la même application.
    window.addEventListener('storage', relire)
    return () => {
      window.removeEventListener('mes-images-modifiees', relire)
      window.removeEventListener('storage', relire)
    }
  }, [])

  const ajouter = useCallback(async (fichier, motsCles) => {
    const dataURL = await reduireImage(fichier)
    const actuelles = lireImages()

    if (poidsImages(actuelles) + dataURL.length > POIDS_MAX) {
      throw new Error(
        'La réserve d’images personnelles est pleine. Supprimez-en quelques-unes avant d’en ajouter.',
      )
    }

    const nettoyes = motsCles.map((m) => m.trim()).filter(Boolean)
    const image = {
      // Le préfixe évite toute collision avec les identifiants ARASAAC, qui
      // sont numériques.
      id: `perso-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      fichier: null,
      dataURL,
      motsCles: nettoyes.length > 0 ? nettoyes : ['image'],
      categorie: 'mes images',
    }

    try {
      ecrireImages([...actuelles, image])
    } catch {
      throw new Error('Enregistrement impossible : le stockage du navigateur est plein.')
    }
    window.dispatchEvent(new Event('mes-images-modifiees'))
    return image
  }, [])

  const supprimer = useCallback((id) => {
    try {
      ecrireImages(lireImages().filter((i) => i.id !== id))
    } catch {
      /* rien à faire : la suppression libère toujours de la place */
    }
    window.dispatchEvent(new Event('mes-images-modifiees'))
  }, [])

  return { images, ajouter, supprimer }
}
