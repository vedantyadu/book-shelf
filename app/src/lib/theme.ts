import * as SecureStore from 'expo-secure-store'

export type Theme = 'light' | 'dark' | 'system'

export async function getAppTheme(): Promise<Theme> {
  return (await SecureStore.getItemAsync('theme')) as Theme
}

export async function setAppTheme(theme: Theme) {
  return await SecureStore.setItemAsync('theme', theme)
}
