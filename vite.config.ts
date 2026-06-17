import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import reactSsg from 'vite-plugin-react-ssg'

// https://vite.dev/config/
// reactSsg() prerenders each route to static HTML at build time (closeBundle):
// instant first paint + crawlable DOM, then the client hydrates (see main.tsx).
// Routes to prerender are declared in react-ssg.config.ts (project root).
export default defineConfig({
  plugins: [react(), tailwindcss(), reactSsg()],
})
