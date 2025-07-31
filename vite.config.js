import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.0.232',
      'b7a1de8ab2fb.ngrok.app',
      '.ngrok.app',
      '.ngrok.io'
    ]
  }
})
