import axios, { type AxiosAdapter, type AxiosRequestConfig, type AxiosResponse } from 'axios'

const uniAdapter: AxiosAdapter = (config) => new Promise((resolve, reject) => {
  uni.request({
    url: `${config.baseURL ?? ''}${config.url ?? ''}`,
    method: (config.method?.toUpperCase() ?? 'GET') as UniApp.RequestOptions['method'],
    data: config.data,
    header: config.headers as Record<string, string>,
    success: (res) => resolve({
      data: res.data,
      status: res.statusCode,
      statusText: String(res.statusCode),
      headers: res.header,
      config,
      request: res,
    } as AxiosResponse),
    fail: reject,
  })
})

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
  adapter: uniAdapter,
})

http.interceptors.response.use((response) => response.data)

export type ApiConfig = AxiosRequestConfig
