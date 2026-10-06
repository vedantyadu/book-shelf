import { getAppTheme, setAppTheme } from '@/lib/theme'
import { useColorScheme } from 'nativewind'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeType = 'light' | 'dark' | 'system'

type ThemeContextType = {
  currentTheme: ThemeType
  changeCurrentTheme: (theme: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('system')
  const { setColorScheme } = useColorScheme()

  const changeCurrentTheme = async (theme: ThemeType) => {
    await setAppTheme(theme)
    setCurrentTheme(theme)
    setColorScheme(theme)
  }

  useEffect(() => {
    const fetchTheme = async () => {
      const theme = (await getAppTheme()) ?? 'system'
      changeCurrentTheme(theme)
    }
    fetchTheme()
  }, [])

  return (
    <ThemeContext.Provider value={{ currentTheme, changeCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeContextProvider')
  }
  return context
}
