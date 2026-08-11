import { defineConfig } from 'vite'
import uniPackage from '@dcloudio/vite-plugin-uni'

// 旧版 UniApp/Vite 4 插件在新版本 Node 的 ESM 互操作下会出现双层 default。
const uni = (uniPackage as unknown as { default?: typeof uniPackage }).default ?? uniPackage

export default defineConfig({
  plugins: [uni()],
  server: { port: 5173 },
})
