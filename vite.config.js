import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Sur GitHub Pages le site est servi depuis https://<user>.github.io/<depot>/ :
// `base` doit donc porter le nom du dépôt. Surchargeable par VITE_BASE
// (par exemple VITE_BASE=/ pour un déploiement à la racine d'un domaine).
const base = process.env.VITE_BASE ?? '/Picto-Generator/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
