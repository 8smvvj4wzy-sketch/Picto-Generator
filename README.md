# Générateur de supports visuels

Application web permettant de produire rapidement des supports visuels
imprimables à partir d'une bibliothèque de pictogrammes ARASAAC embarquée :
**emplois du temps visuels**, **séquentiels de tâche** et **tableaux de jetons**.

Objectif : ramener à quelques minutes la création d'un support qui prend
aujourd'hui 20 à 30 minutes dans un traitement de texte.

- Site statique, aucun backend, aucun compte utilisateur
- Fonctionne **entièrement hors ligne** une fois chargée (pack embarqué + PWA)
- Sortie **PDF A4** par l'impression du navigateur
- Toutes les données restent locales (`localStorage`), aucune donnée nominative

Le cahier des charges complet est dans [`SPEC.md`](SPEC.md).

---

## Démarrage

```bash
npm install
npm run build:pictos   # constitue le pack de pictogrammes (une seule fois)
npm run dev
```

L'application est alors disponible sur <http://localhost:5173/Picto-Generator/>.

> Tant que `npm run build:pictos` n'a pas été lancé, l'application s'ouvre sur un
> écran expliquant la marche à suivre : les éditeurs restent utilisables, mais
> sans pictogrammes.

### Constituer le pack de pictogrammes

Le pack n'est **pas** téléchargé par l'application : il est constitué une fois
pour toutes par un script, puis versionné dans le dépôt. C'est ce qui rend le
fonctionnement hors ligne possible.

```bash
npm run build:pictos                 # ~400 à 600 pictogrammes
node scripts/build-pictos.mjs --help # options disponibles
```

Le script :

1. lit `scripts/vocabulaire.json` (8 catégories, ~200 mots-clés) ;
2. interroge l'API publique ARASAAC en français pour chaque mot-clé ;
3. déduplique par identifiant et télécharge chaque image dans `public/pictos/` ;
4. écrit `public/pictos/index.json`, **seul fichier lu par l'application** ;
5. récupère le logo ARASAAC dans `public/logo-arasaac.png` pour le pied de page.

Format de `public/pictos/index.json` :

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

**Pensez à committer `public/pictos/`** : c'est ce dossier qui part sur GitHub
Pages et qui rend l'application autonome.

Pour enrichir le pack : ajoutez un mot-clé dans `scripts/vocabulaire.json` et
relancez la commande. Les fichiers déjà téléchargés sont conservés.

Si ARASAAC ne sert pas le SVG au moment de l'exécution, le script bascule
automatiquement sur le PNG haute résolution et l'indique dans son rapport ;
`index.json` enregistre le nom de fichier réel, l'application s'adapte sans
modification.

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | construit `dist/` |
| `npm run preview` | sert `dist/` en local (service worker actif) |
| `npm run build:pictos` | constitue ou enrichit le pack de pictogrammes |

## Utilisation

1. Choisissez le type de support dans l'en-tête.
2. Réglez la disposition, le nombre de cases, la taille des pictogrammes, le
   contraste dans le panneau de droite.
3. Cliquez sur une case de l'aperçu pour la sélectionner, puis sur un
   pictogramme de la Bibliothèque : la sélection avance toute seule, ce qui
   permet d'enchaîner les cases sans aller-retour.
4. Saisissez les libellés directement dans l'aperçu.
5. **Imprimer** : le navigateur produit un PDF A4. L'aperçu à l'écran est le
   rendu imprimé.

**Mes modèles** enregistre les supports dans le navigateur, permet de les
rouvrir, dupliquer, supprimer, et de les exporter en JSON pour les partager
entre collègues (les pictogrammes étant embarqués, un fichier léger suffit).

**Hors ligne / tablette** : à la première visite en ligne, le service worker met
l'application et tout le pack en cache — l'en-tête affiche « Disponible hors
ligne » une fois terminé. L'application peut ensuite être installée depuis le
navigateur et utilisée wifi coupé.

## Déploiement

Chaque push sur `main` déclenche `.github/workflows/deploy.yml`, qui construit
le site et le publie sur GitHub Pages. Activez Pages une fois pour toutes dans
**Settings → Pages → Source : GitHub Actions**.

Le chemin de base est `/Picto-Generator/` (`vite.config.js`). Pour un
déploiement ailleurs, surchargez-le :

```bash
VITE_BASE=/ npm run build
```

## Structure

```
.github/workflows/deploy.yml   publication sur GitHub Pages
scripts/build-pictos.mjs       constitution du pack ARASAAC
scripts/vocabulaire.json       mots-clés recherchés, par catégorie
public/pictos/                 pack embarqué (versionné) + index.json
public/sw.js                   service worker (cache application + pack)
src/bibliotheque/              recherche, filtres, favoris
src/editeurs/                  les trois éditeurs de support
src/support/                   page A4, pictogramme, pied de page d'attribution
src/modeles/                   enregistrement local, export/import JSON
src/impression/                mise à l'échelle de l'aperçu, feuille d'impression
```

## Attribution et licence

Les pictogrammes utilisés sont la propriété du **Gouvernement d'Aragon**, créés
par **Sergio Palao** pour **[ARASAAC](https://arasaac.org)**, et diffusés sous
licence **Creative Commons BY-NC-SA 4.0**.

La mention « © ARASAAC — Gouvernement d'Aragon (auteur : Sergio Palao) » est
imprimée automatiquement en pied de **chaque** support produit et n'est pas
désactivable.

Le code de ce dépôt est sous licence MIT ; les pictogrammes de `public/pictos/`
restent sous CC BY-NC-SA, clause de partage à l'identique incluse. Voir
[`LICENSE`](LICENSE).

Toute commercialisation future du produit devrait se faire sans ces
pictogrammes.
