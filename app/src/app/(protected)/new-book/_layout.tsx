import { NewBookContextProvider } from '@/context/new-book-context'
import { Stack } from 'expo-router'

export default function NewBookLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NewBookContextProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name='index' />
        <Stack.Screen name='[page_id]' />
        <Stack.Screen
          options={{ freezeOnBlur: true }}
          name='pages'
        />
      </Stack>
    </NewBookContextProvider>
  )
}
