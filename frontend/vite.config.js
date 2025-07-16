import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Nota: Tailwind no es un plugin de Vite, sino un plugin para PostCSS,
// para Tailwind debes tener tailwind.config.js y postcss.config.js configurados.
// Por eso no se importa como '@tailwindcss/vite', sino que Tailwind funciona vía PostCSS.

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
