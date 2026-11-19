import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// El navegador solo habla con este servidor (localhost:3001).
// Vite reenvia las llamadas a n8n y al servicio de seguridad, asi no hay CORS ni ngrok.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const n8n = env.N8N_URL || 'http://localhost:5678'
  const rutaWebhook = env.N8N_WEBHOOK_PATH || '/webhook/consulta-expedientes-rag'
  const seguridad = new URL(env.SEGURIDAD_URL || 'http://172.29.55.29:8084/api/v1')
  const basePath = seguridad.pathname.replace(/\/$/, '')

  return {
    plugins: [vue()],
    server: {
      port: 3001,
      strictPort: true,
      proxy: {
        '/n8n': {
          target: n8n,
          changeOrigin: true,
          // Las preguntas con IA hacen 2 llamadas al modelo: se permite hasta 60 s
          timeout: 60000,
          proxyTimeout: 60000,
          rewrite: () => rutaWebhook,
        },
        '/seguridad': {
          target: seguridad.origin,
          changeOrigin: true,
          timeout: 30000,
          proxyTimeout: 30000,
          rewrite: (path) => path.replace(/^\/seguridad/, basePath),
        },
      },
    },
  }
})
