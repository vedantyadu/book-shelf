import { LoadScreen } from '@/components/app/load-screen'
import { useAppContext } from '@/context/app-context'
import { ScanContextProvider } from '@/context/scan-context'
import { Redirect, Stack } from 'expo-router'

export default function ProtectedLayout() {
  const { auth } = useAppContext()

  if (auth.loading) {
    return <LoadScreen />
  }
  if (!auth.user) {
    return <Redirect href='/auth' />
  }
  return (
    <ScanContextProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name='index' />
        <Stack.Screen name='settings' />
        <Stack.Screen name='scan-result' />
      </Stack>
    </ScanContextProvider>
  )
}
