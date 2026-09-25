import * as SecureStore from 'expo-secure-store'

export async function getAccessToken() {
  return await SecureStore.getItemAsync('access_token')
}

export async function setAccessToken(token: string) {
  return await SecureStore.setItemAsync('access_token', token)
}

export async function removeAccessToken() {
  return await SecureStore.deleteItemAsync('access_token')
}

export async function getRefreshToken() {
  return await SecureStore.getItemAsync('refresh_token')
}

export async function setRefreshToken(token: string) {
  return await SecureStore.setItemAsync('refresh_token', token)
}

export async function removeRefreshToken() {
  return await SecureStore.deleteItemAsync('refresh_token')
}
