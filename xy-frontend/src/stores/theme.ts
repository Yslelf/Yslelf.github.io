import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeId = 'mint' | 'river' | 'sunset'

export const themes = [
  { id: 'mint' as const, name: '城市薄荷', description: '清新自然', color: '#258A73', soft: '#E4F5EE' },
  { id: 'river' as const, name: '赣江晴蓝', description: '清爽通透', color: '#367FA3', soft: '#E5F2F7' },
  { id: 'sunset' as const, name: '日落暖橙', description: '温暖松弛', color: '#C97848', soft: '#FAECE3' },
]

export const useThemeStore = defineStore('theme', () => {
  const saved = uni.getStorageSync('xy-theme') as ThemeId
  const current = ref<ThemeId>(themes.some(item => item.id === saved) ? saved : 'mint')
  const activeTheme = computed(() => themes.find(item => item.id === current.value) ?? themes[0])

  function setTheme(id: ThemeId) {
    current.value = id
    uni.setStorageSync('xy-theme', id)
  }

  return { current, activeTheme, setTheme }
})
