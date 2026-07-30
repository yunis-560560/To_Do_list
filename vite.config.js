import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // For Vercel, the app is hosted at the root domain, so base should be '/'
  base: '/',
  plugins: [react(), tailwindcss()],
})