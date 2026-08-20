import mock from '@/mock/mock.json'
import type { ExploreData, ExplorePostQuery, PostComment } from '@/types/explore'
import { http } from './http'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export async function getExploreData(): Promise<ExploreData> {
  if (useMock) return Promise.resolve(mock as ExploreData)
  return http.get('/explore/home') as unknown as Promise<ExploreData>
}

export async function getExplorePosts(query: ExplorePostQuery) {
  if (useMock) return Promise.resolve((mock as ExploreData).posts)
  return http.get('/explore/posts', { params: query })
}

export async function setPostLike(postId: number, active: boolean) {
  if (useMock) return Promise.resolve()
  await http.request({ url: `/posts/${postId}/likes`, method: active ? 'POST' : 'DELETE' })
}

export async function setPostCollection(postId: number, active: boolean) {
  if (useMock) return Promise.resolve()
  await http.request({ url: `/posts/${postId}/collections`, method: active ? 'POST' : 'DELETE' })
}

export async function markPostUseful(postId: number) {
  if (useMock) return Promise.resolve()
  await http.post(`/posts/${postId}/useful`)
}

export async function createPostComment(postId: number, content: string): Promise<PostComment> {
  if (useMock) return Promise.resolve({ id: Date.now(), postId, author: '我', content, time: '刚刚', liked: false })
  return http.post(`/posts/${postId}/comments`, { content }) as unknown as Promise<PostComment>
}

export async function setPlaceWanted(placeId: number, active: boolean) {
  if (useMock) return Promise.resolve()
  await http.request({ url: `/places/${placeId}/wanted`, method: active ? 'POST' : 'DELETE' })
}

export async function createPlaceCheckIn(placeId: number) {
  if (useMock) return Promise.resolve()
  await http.post(`/places/${placeId}/check-ins`)
}
