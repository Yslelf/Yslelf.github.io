import mock from '@/mock/mock.json'
import type { ExploreData } from '@/types/explore'
import { http } from './http'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export async function getExploreData(): Promise<ExploreData> {
  if (useMock) return Promise.resolve(mock as ExploreData)
  return http.get('/explore/home') as unknown as Promise<ExploreData>
}
