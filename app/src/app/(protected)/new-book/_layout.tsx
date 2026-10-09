import { NewBookContextProvider } from '@/context/scan-context'
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
      />
    </NewBookContextProvider>
  )
}
