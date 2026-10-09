import { createContext, useContext, useState } from 'react'

export type PageStateType = 'processing' | 'ready' | 'error'

export type PageType = {
  id: string
  uri: string
  text: string | null
  state: PageStateType
}

type ScanContextType = {
  pages: PageType[]
  setPages: React.Dispatch<React.SetStateAction<PageType[]>>
  selectedPages: string[]
  setSelectedPages: React.Dispatch<React.SetStateAction<string[]>>
}

const NewBookContext = createContext<ScanContextType | undefined>(undefined)

export function NewBookContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pages, setPages] = useState<PageType[]>([])
  const [selectedPages, setSelectedPages] = useState<string[]>([])

  return (
    <NewBookContext.Provider
      value={{ pages, setPages, selectedPages, setSelectedPages }}
    >
      {children}
    </NewBookContext.Provider>
  )
}

export function useNewBookContext() {
  const context = useContext(NewBookContext)
  if (context === undefined) {
    throw new Error(
      'useNewBookContext must be used within a NewBookContextProvider',
    )
  }
  return context
}
