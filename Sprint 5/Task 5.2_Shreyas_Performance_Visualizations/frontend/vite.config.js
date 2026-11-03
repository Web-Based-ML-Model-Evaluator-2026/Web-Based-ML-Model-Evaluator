import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration with dedicated port 5174
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});