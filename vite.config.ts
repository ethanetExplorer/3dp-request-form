import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? '/3dp-request-form/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5174,
    host: true
  }
});
