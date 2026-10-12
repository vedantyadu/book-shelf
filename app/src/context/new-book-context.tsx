import { createContext, useContext, useState } from 'react'

export type PageStateType = 'processing' | 'ready' | 'error' | 'queued'

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
  currentPageId: string
  setCurrentPageId: React.Dispatch<React.SetStateAction<string>>
}

const NewBookContext = createContext<ScanContextType | undefined>(undefined)

export function NewBookContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pages, setPages] = useState<PageType[]>(
    Array.from(
      {
        length: 250,
      },
      (_, index) => ({
        id: `${index}`,
        uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
        text: 'Hello World adhasjdhasjkdhaksdjhakjsdha ashdjaksd dasjk djkasd hasjkdjka sdjkhasd jkahsdjk hasdkjja hsdj ahsdj kas djkas as dasdj',
        state: 'ready',
      }),
    ),
  )
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [currentPageId, setCurrentPageId] = useState('')

  return (
    <NewBookContext.Provider
      value={{
        pages,
        setPages,
        selectedPages,
        setSelectedPages,
        currentPageId,
        setCurrentPageId,
      }}
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
