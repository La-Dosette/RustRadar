import { defineConfig } from 'vite';

// Chemins relatifs : la même compilation fonctionne servie par server.mjs à la racine
// et sur GitHub Pages sous /<depot>/.
export default defineConfig({ base: './' });
