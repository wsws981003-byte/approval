import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    // 404.html을 빌드 폴더에 index.html과 동일하게 생성
    {
      name: 'generate-404',
      closeBundle() {
        if (process.env.NODE_ENV === 'production') {
          try {
            // 빌드된 index.html 읽기
            const indexPath = join(__dirname, 'build', 'index.html')
            const indexContent = readFileSync(indexPath, 'utf-8')
            
            // 404.html 생성 (index.html과 동일)
            const four04Path = join(__dirname, 'build', '404.html')
            writeFileSync(four04Path, indexContent)
            console.log('✅ 404.html generated successfully')
          } catch (err) {
            console.error('❌ Failed to generate 404.html:', err)
          }
        }
      }
    }
  ],
  base: process.env.NODE_ENV === 'production' ? '/approval/' : '/',
  build: {
    outDir: 'build',
    copyPublicDir: true
  },
  server: {
    historyApiFallback: true,
    port: 5173,
    strictPort: false,
    open: true,
    host: true
  }
})

