import { useEffect, useMemo, useState } from 'react'
import { preparer } from './recherche.js'

const URL_INDEX = `${import.meta.env.BASE_URL}pictos/index.json`

/**
 * Charge le pack de pictogrammes embarqué.
 *
 * Un seul appel réseau, au démarrage, vers un fichier statique du site :
 * l'application n'interroge jamais ARASAAC. Une fois l'index en mémoire,
 * tout fonctionne hors ligne.
 *
 * États : 'chargement' | 'pret' | 'absent' | 'erreur'
 */
export function usePictos() {
  const [etat, setEtat] = useState('chargement')
  const [brut, setBrut] = useState([])
  const [erreur, setErreur] = useState(null)

  useEffect(() => {
    let annule = false

    async function charger() {
      try {
        const reponse = await fetch(URL_INDEX, { cache: 'no-cache' })
        if (reponse.status === 404) {
          if (!annule) setEtat('absent')
          return
        }
        if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`)
        const donnees = await reponse.json()
        if (annule) return
        if (!Array.isArray(donnees) || donnees.length === 0) {
          setEtat('absent')
          return
        }
        setBrut(donnees)
        setEtat('pret')
      } catch (e) {
        if (annule) return
        // Un index.json absent renvoie souvent du HTML (page 404 du serveur) :
        // l'erreur d'analyse JSON signifie donc « pack non constitué ».
        if (e instanceof SyntaxError) setEtat('absent')
        else {
          setErreur(e)
          setEtat('erreur')
        }
      }
    }

    charger()
    return () => {
      annule = true
    }
  }, [])

  const pack = useMemo(() => brut.map(preparer), [brut])

  const categories = useMemo(() => {
    const vues = new Map()
    for (const entree of pack) vues.set(entree.categorie, (vues.get(entree.categorie) ?? 0) + 1)
    return [...vues.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'fr'))
      .map(([nom, nombre]) => ({ nom, nombre }))
  }, [pack])

  const parId = useMemo(() => new Map(pack.map((p) => [p.id, p])), [pack])

  return { etat, erreur, pack, categories, parId }
}
