import { LoadScreen } from '@/components/app/load-screen'
import { useAppContext } from '@/context/app-context'
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
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='settings' />
      <Stack.Screen name='new-book' />
    </Stack>
  )
}
