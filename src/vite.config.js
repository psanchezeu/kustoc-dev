import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Detectar todos los archivos TypeScript en la carpeta api para excluirlos del proxy
const API_TS_FILES = fs.readdirSync(path.resolve(__dirname, './api'))
  .filter(file => file.endsWith('.ts'))
  .map(file => `/api/${file}`);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Asegurarse de que las importaciones de API resuelvan correctamente
      '/api': path.resolve(__dirname, './api'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  esbuild: {
    // Eliminamos jsxInject para evitar duplicación
    target: 'es2020'
  },
  build: {
    outDir: '../dist',
    target: 'es2020'
  },
  server: {
    proxy: {
      // Configurar un proxy más específico que excluya los archivos TS conocidos
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true, 
        secure: false,
        rewrite: (path) => path,
        bypass: (req) => {
          // Ignorar explícitamente las solicitudes a archivos TypeScript API
          if (req.url.endsWith('.ts')) {
            console.log('⚠️ Bypassing TS file request:', req.url);
            return req.url; // Devolver la URL para que Vite la maneje como recurso estático
          }
          
          // Si es una solicitud a /api/copilots, imprimimos información pero NUNCA hacemos bypass
          if (req.url.includes('/api/copilots')) {
            console.log('👀 Proxy redirigiendo solicitud a copilotos:', req.url);
            return; // No hacer bypass, permitir que el proxy maneje esta solicitud
          }
          
          // También evitar que se procesen importaciones de módulos
          if (req.url.includes('?') || req.url.includes('module=')) {
            console.log('⚠️ Bypassing module request:', req.url);
            return req.url;
          }
        },
        configure: (proxy, options) => {
          // Configuración adicional del proxy para debugging
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      }
    }
  }
});
