import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  appType: 'spa',
  preview: {
    // Production önizlemede sayfa yenilemede 404 olmaması için
    host: true,
  },
})
