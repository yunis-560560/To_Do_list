import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // REQUIRED for GitHub Pages: sets the base path to the repo name
  // Without this, assets load from '/' and the page is blank on GH Pages
  base: '/To_Do_list/',
  plugins: [react(), tailwindcss()],
})
