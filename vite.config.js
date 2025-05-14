import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Asegurar que los archivos estáticos se procesen correctamente
  publicDir: './src/public',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020'
    }
  },
  css: {
    // Habilitar la generación de sourcemaps para CSS
    devSourcemap: true,
    // Asegurarse de que PostCSS procese correctamente los archivos
    postcss: {}
  },
  build: {
    outDir: './dist',
    target: 'es2020',
    // Asegurarse de que los activos estáticos se manejen correctamente
    assetsDir: 'assets',
    // Incluir información de sourcemaps en producción
    sourcemap: true,
    // Configuración para manejo de CSS
    cssCodeSplit: true,
    // No minimizar CSS para depuración
    cssMinify: false,
  },
  // Definir el directorio raíz para la aplicación
  root: './src',
  // Asegurarse de que las rutas base sean correctas en producción
  base: '/'
});
