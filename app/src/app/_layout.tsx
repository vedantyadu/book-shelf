import { AuthProvider } from '@/context/AuthContext'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { useColorScheme } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name='(protected)' />
          <Stack.Screen name='auth' />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  )
}
