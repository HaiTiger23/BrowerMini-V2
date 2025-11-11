import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ command }) => ({
  root: path.resolve(__dirname, 'src/ui'),
  plugins: [react()],
  base: command === 'build' ? './' : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/ui')
    }
  }
}))
