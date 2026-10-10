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
}

const NewBookContext = createContext<ScanContextType | undefined>(undefined)

export function NewBookContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pages, setPages] = useState<PageType[]>([
    {
      id: '1',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World adhasjdhasjkdhaksdjhakjsdha ashdjaksd dasjk djkasd hasjkdjka sdjkhasd jkahsdjk hasdkjja hsdj ahsdj kas djkas as dasdj',
      state: 'ready',
    },
    {
      id: '2',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'processing',
    },
    {
      id: '3',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'queued',
    },
    {
      id: '4',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'ready',
    },
    {
      id: '5',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'processing',
    },
    {
      id: '6',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'error',
    },
    {
      id: '7',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'ready',
    },
    {
      id: '8',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'processing',
    },
    {
      id: '9',
      uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      text: 'Hello World',
      state: 'error',
    },
    // {
    //   id: '10',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'ready',
    // },
    // {
    //   id: '11',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'processing',
    // },
    // {
    //   id: '12',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'error',
    // },
    // {
    //   id: '13',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'ready',
    // },
    // {
    //   id: '14',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'processing',
    // },
    // {
    //   id: '15',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'error',
    // },
    // {
    //   id: '16',
    //   uri: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
    //   text: 'Hello World',
    //   state: 'ready',
    // },
  ])
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
