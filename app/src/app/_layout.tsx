import { LoadScreen } from '@/components/app/load-screen'
import '../global.css'

import { AppProvider } from '@/context/app-context'
import { DeepLinkContextProvider } from '@/context/deep-link-context'
import { ThemeContextProvider } from '@/context/theme-context'
import { fontList } from '@/utils/fonts'
import { themes } from '@/utils/themes'
import { useFonts } from 'expo-font'
import { NavigationBar } from 'expo-navigation-bar'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'nativewind'
import { View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  const [fontLoaded] = useFonts(fontList)
  const { colorScheme } = useColorScheme()

  if (!fontLoaded) {
    return <LoadScreen />
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <ThemeContextProvider>
          <DeepLinkContextProvider>
            <View
              style={themes[colorScheme ?? 'light']}
              className='flex-1 bg-bg-primary'
            >
              <StatusBar
                style={(colorScheme ?? 'light') === 'light' ? 'dark' : 'light'}
              />
              <Stack
                initialRouteName='(protected)'
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: 'transparent',
                  },
                }}
              >
                <Stack.Screen name='(protected)' />
                <Stack.Screen name='auth' />
              </Stack>
              <NavigationBar
                style={(colorScheme ?? 'light') === 'light' ? 'dark' : 'light'}
              />
            </View>
          </DeepLinkContextProvider>
        </ThemeContextProvider>
      </AppProvider>
    </GestureHandlerRootView>
  )
}
