import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import './server/loadEnv.js'
import { handleWeatherChat } from './server/weatherChat.js'

const weatherChatApi = () => ({
  name: 'weather-chat-api',
  configureServer(server) {
    server.middlewares.use('/api/weather-chat', handleWeatherChat)
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), weatherChatApi()],
})
