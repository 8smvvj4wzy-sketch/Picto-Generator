# Cahier des charges — Générateur de supports visuels

> Document de référence du projet. À placer à la racine du dépôt (`SPEC.md` ou `docs/cahier-des-charges.md`) pour servir de contexte à chaque session de développement.

---

## 1. Objectif

Application web permettant de produire rapidement des supports visuels imprimables à partir d'une bibliothèque de pictogrammes ARASAAC embarquée : emplois du temps visuels, séquentiels de tâche et tableaux de jetons.

Objectif métier : ramener à quelques minutes la création d'un support qui prend aujourd'hui 20 à 30 minutes dans un traitement de texte.

## 2. Contraintes

| Contrainte | Détail |
|---|---|
| Hébergement | Site statique sur GitHub Pages, déployé par GitHub Actions |
| Backend | Aucun. Pas de serveur, pas de base de données, pas de compte utilisateur |
| Réseau | Doit fonctionner **entièrement hors ligne** une fois chargée (pack de pictos embarqué + PWA) |
| Postes | Mac de bureau (usage principal, impression) et tablettes Android de l'établissement |
| Sortie | PDF A4 via l'impression navigateur |
| Données | Tout en local (`localStorage`). Aucune donnée nominative d'apprenant |

## 3. Stack

- Vite + React
- CSS simple ou Tailwind (aligner sur ce qui est déjà utilisé pour l'application ABA, pour ne pas multiplier les habitudes)
- Aucune dépendance PDF : la mise en page est du HTML/CSS imprimé par le navigateur
- `base` de Vite configurée sur le nom du dépôt pour GitHub Pages

## 4. Découpage en lots

### Lot 1 — Socle pictogrammes *(priorité)*

C'est le cœur du projet : sans bibliothèque fiable et rapide à interroger, les éditeurs ne servent à rien.

#### 4.1 Script de constitution du pack

Script Node exécuté **une seule fois** (ou à la demande), hors de l'application : `scripts/build-pictos.mjs`.

Fonctionnement :
1. Lit un fichier de configuration `scripts/vocabulaire.json` contenant les mots-clés recherchés, groupés par catégorie
2. Interroge l'API publique ARASAAC (`api.arasaac.org`) en français pour chaque mot-clé
3. Télécharge le **SVG** de chaque pictogramme retenu dans `public/pictos/<id>.svg`
4. Déduplique par identifiant
5. Génère `public/pictos/index.json`

Format de `index.json` :

```json
[
  {
    "id": 2462,
    "fichier": "2462.svg",
    "motsCles": ["manger", "repas", "déjeuner"],
    "categorie": "repas"
  }
]
```

Volume cible : **400 à 600 pictogrammes**. La base ARASAAC en compte plus de 40 000 ; embarquer l'ensemble n'a aucun intérêt et alourdirait inutilement le dépôt. Le SVG maintient le pack à quelques mégaoctets tout en imprimant net à n'importe quelle taille.

Catégories de départ pour `vocabulaire.json` :

- **Routines** : se lever, s'habiller, se laver les mains, brosser les dents, toilettes, manger, dormir, ranger, mettre son manteau
- **Ateliers et activités** : travailler, lire, écrire, dessiner, découper, coller, ordinateur, musique, sport, jeu, puzzle, cuisine, jardinage, courses
- **Lieux** : classe, salle, cantine, cour, gymnase, bus, maison, piscine
- **Aliments** : eau, pain, fruit, légume, gâteau, yaourt…
- **Émotions et états** : content, triste, en colère, fatigué, calme, malade, avoir mal
- **Consignes** : attendre, écouter, regarder, stop, aider, demander, tour de rôle, silence
- **Objets** : table, chaise, crayon, ciseaux, livre, sac, téléphone, jeton, cadeau
- **Repères temporels** : matin, après-midi, soir, jours de la semaine, fini, bientôt

Le fichier doit rester facile à compléter : un ajout de mot-clé + relance du script suffit à enrichir le pack.

#### 4.2 Écran Bibliothèque

- Champ de recherche filtrant en direct sur les mots-clés
- Recherche **insensible aux accents et à la casse** (normalisation NFD des deux côtés)
- Filtres par catégorie
- Affichage en grille, chargement paresseux des vignettes
- Favoris (stockés en `localStorage`), affichables en premier
- Clic sur un pictogramme = ajout au support en cours d'édition

### Lot 2 — Les trois éditeurs

Base commune : format A4 portrait ou paysage, titre du support, aperçu fidèle à l'impression (WYSIWYG), pied de page d'attribution automatique.

#### Emploi du temps visuel
- Disposition : bande verticale, bande horizontale ou grille
- Nombre de cases : 2 à 12
- Par case : pictogramme, libellé texte, heure (facultative), case à cocher « fait » (facultative)
- Taille des pictogrammes : petit / moyen / grand
- Option contraste : couleur ou noir et blanc (économie d'encre)

#### Séquentiel de tâche
- Étapes numérotées automatiquement (1 à n)
- Disposition : bande verticale ou horizontale
- Par étape : pictogramme, libellé court, numéro visible ou masqué
- Option case à cocher par étape
- Option flèches de liaison entre les étapes

#### Tableau de jetons
- Nombre de jetons : 1 à 10
- Forme du jeton : rond, étoile, carré
- Pictogramme du renforçateur, placé à droite ou en bas
- Libellé du comportement cible en en-tête
- Emplacements vides destinés au collage de jetons plastifiés (pas de remplissage numérique)

### Lot 3 — Confort d'usage

- **Mes modèles** : enregistrement d'un support en `localStorage`, réouverture, duplication, suppression
- **Export / import JSON** d'un modèle ou de toute la bibliothèque de modèles, pour partage entre collègues (les pictos étant embarqués, un fichier JSON léger suffit)
- **PWA** : `manifest.webmanifest` + service worker mettant en cache l'application et le pack de pictos, pour un fonctionnement hors ligne et une installation sur les tablettes

## 5. Impression

- `@page { size: A4; margin: 10mm; }`
- Media query `@media print` masquant toute l'interface hors de la zone support
- `break-inside: avoid` sur chaque case pour éviter les coupures
- Couleurs préservées : `print-color-adjust: exact`
- Le rendu à l'écran doit être identique au rendu imprimé

## 6. Licence et attribution

Les pictogrammes ARASAAC sont diffusés en **Creative Commons BY-NC-SA** : attribution obligatoire, usage non commercial, partage à l'identique.

Obligations à implémenter :
- Mention automatique en pied de page de **chaque support imprimé** : `© ARASAAC — Gouvernement d'Aragon (auteur : Sergio Palao)`, non désactivable
- Logo ARASAAC dans le pied de page
- Fichier `LICENSE` et section d'attribution dans le `README` du dépôt
- Le dépôt étant public et redistribuant des pictogrammes, la clause « partage à l'identique » s'applique aux fichiers concernés

Conséquence à garder en tête : toute commercialisation future du produit devrait se faire sans ces pictogrammes.

## 7. Hors périmètre (version 1)

- Comptes utilisateurs, synchronisation, serveur
- Import de photos ou de pictogrammes personnels *(évolution envisagée)*
- Planches PECS / cartes de choix *(évolution envisagée)*
- Génération de texte par IA
- Toute donnée nominative

## 8. Critères d'acceptation

1. L'application se charge et fonctionne intégralement **wifi coupé**
2. Une recherche sur « laver » retourne le pictogramme attendu en moins d'une seconde
3. Un emploi du temps de 6 cases se compose en moins de 2 minutes
4. Le PDF imprimé tient sur une page A4, pictogrammes nets, sans élément d'interface parasite
5. Un modèle enregistré se rouvre à l'identique après fermeture du navigateur
6. Le pied de page d'attribution est présent sur tous les supports produits

## 9. Structure du dépôt

```
/
├─ .github/workflows/deploy.yml
├─ public/
│  └─ pictos/
│     ├─ index.json
│     └─ *.svg
├─ scripts/
│  ├─ build-pictos.mjs
│  └─ vocabulaire.json
├─ src/
│  ├─ bibliotheque/
│  ├─ editeurs/
│  │  ├─ EmploiDuTemps.jsx
│  │  ├─ Sequentiel.jsx
│  │  └─ TableauJetons.jsx
│  ├─ modeles/
│  └─ impression/
├─ LICENSE
├─ README.md
└─ SPEC.md
```

## 10. Ordre de développement suggéré

1. Squelette Vite + déploiement GitHub Pages fonctionnel (valider la chaîne avant tout le reste)
2. Script de constitution du pack + `index.json`
3. Écran Bibliothèque avec recherche et favoris
4. Éditeur Emploi du temps + impression (le plus utilisé, sert de patron aux deux autres)
5. Éditeur Séquentiel
6. Éditeur Tableau de jetons
7. Mes modèles + export/import
8. PWA et installation sur tablette
