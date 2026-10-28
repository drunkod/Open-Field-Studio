import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Vite 8 dev client: explicitly replace internal constants in non-bundled mode.
    __BUNDLED_DEV__: 'false',
    __SERVER_FORWARD_CONSOLE__: 'false',
  },
  // Prevent Vite from obscuring Rust errors
  clearScreen: false,
  server: {
    // Tauri expects a fixed port
    port: 3042,
    strictPort: true,
    host: true,
    // Allow Tauri's custom protocol to connect
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})
