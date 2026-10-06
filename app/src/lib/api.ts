import axios, { HttpStatusCode } from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from './access_token'

const API_URL = process.env.EXPO_PUBLIC_API_URL

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken()
  if (accessToken) {
    config.headers['Authorization'] = 'Bearer ' + accessToken
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === HttpStatusCode.Unauthorized && !originalRequest.retry) {
      originalRequest.retry = true
      const newTokens = await fetchNewTokens()

      await setAccessToken(newTokens.access_token)
      await setRefreshToken(newTokens.refresh_token)

      originalRequest.headers['Authorization'] =
        `Bearer ${newTokens.access_token}`

      return axios(originalRequest)
    }

    return Promise.reject(error)
  },
)

async function fetchNewTokens() {
  const refreshToken = await getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const response = await axios.post(`${API_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  })

  await setAccessToken(response.data.access_token)
  await setRefreshToken(response.data.refresh_token)

  return response.data
}
