import { createContext, useContext, useEffect, useState } from 'react'
import * as Linking from 'expo-linking'

export type DeepLinkContextType = {
  currentURL: string | null
  setCurrentURL: (uri: string | null) => void
}

export const DeepLinkContext = createContext<DeepLinkContextType | undefined>(
  undefined,
)

export function DeepLinkContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentURL, setCurrentURL] = useState<string | null>(null)

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        setCurrentURL(url)
      }
    })

    const subscription = Linking.addEventListener(
      'url',
      (event: { url: string }) => {
        setCurrentURL(event.url)
      },
    )

    return () => subscription.remove()
  }, [])

  return (
    <DeepLinkContext.Provider value={{ currentURL, setCurrentURL }}>
      {children}
    </DeepLinkContext.Provider>
  )
}

export function useDeepLink() {
  const context = useContext(DeepLinkContext)
  if (context === undefined) {
    throw new Error('useDeepLink must be used within DeepLinkContextProvider')
  }
  return context
}
