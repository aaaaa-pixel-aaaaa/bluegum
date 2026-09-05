import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Served from a GitHub Pages project subpath: https://<user>.github.io/bluegum/
// Must stay in sync with manifest.json's start_url and scope — see BRIEF.md §8.
export default defineConfig({
  base: '/bluegum/',
  plugins: [react(), tailwindcss()],
})
