import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  server: { host: true, port: 5173 },
  preview: { host: true, port: 5173 }
})
