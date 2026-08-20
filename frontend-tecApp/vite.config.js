import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  
  // --- AGREGADO PARA EL PROXY INVERSO ---
  base: '/frontend-tecApp/', // Asegura que los assets carguen correctamente desde Nginx
  // --- AGREGADO PARA DOCKER ---
  server: {
      host: true,
      port: 5173,
      strictPort: true,
      allowedHosts: [
        'frontend-tecApp', // Permite el nombre del servicio interno
        'localhost'        // Mantiene el acceso local
      ],
      // --- PROXY PARA DESARROLLO LOCAL ---
      // Redirige llamadas /api/* al API Gateway cuando se corre con npm run dev
      proxy: {
        '/api': {
          target: 'http://localhost:9000',
          changeOrigin: true,
        },
      },
    },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
