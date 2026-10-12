import { createContext, useContext, useState } from 'react'

export type PageStateType = 'processing' | 'ready' | 'error' | 'queued'
export type PageViewModeType = 'text' | 'image'

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
  pageViewMode: PageViewModeType
  setPageViewMode: React.Dispatch<React.SetStateAction<PageViewModeType>>
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
        text: `Lorem ipsum dolor sit amet consectetur adipiscing elit. In eu anim magna aut imperdiet qui animi ullamco dolorem temporibus excepteur. Ut facilis et nisi cumque in veniam deserunt.

Sunt temporibus ducimus non vero voluptas mollit. Est proident ullamco et et quas qui officia eum qui minus irure repellendus. Dolores voluptatum optio eligendi elit culpa deleniti.

Est nulla sint facilis lorem qui mollitia et mollitia qui sit est. Eiusmod fuga facilis duis enim officia proident at dolorem sunt illum eiusmod occaecat. Placeat ducimus corrupti dolore mollit exercitation nulla eiusmod incididunt duis at incididunt. Sunt non similique provident cum facilis voluptas in at placeat possimus pariatur laborum. Possimus distinctio occaecat reprehenderit officia assumenda illum adipiscing libero quibusdam.

Vero tempor aut consequat exercitation cum lorem tempore eum. Aut maxime eiusmod cupiditate ea nulla facere tempor omnis dolor harum incididunt proident. Dignissimos consectetur id proident est qui molestias.

Et blanditiis exercitation placeat esse et aut est. In libero eu vel quos adipiscing ad pariatur. Quod dignissimos eos vel dolorum vel sed at ducimus eu.

Lorem ipsum dolor sit amet consectetur adipiscing elit. In eu anim magna aut imperdiet qui animi ullamco dolorem temporibus excepteur. Ut facilis et nisi cumque in veniam deserunt.

Sunt temporibus ducimus non vero voluptas mollit. Est proident ullamco et et quas qui officia eum qui minus irure repellendus. Dolores voluptatum optio eligendi elit culpa deleniti.

Est nulla sint facilis lorem qui mollitia et mollitia qui sit est. Eiusmod fuga facilis duis enim officia proident at dolorem sunt illum eiusmod occaecat. Placeat ducimus corrupti dolore mollit exercitation nulla eiusmod incididunt duis at incididunt. Sunt non similique provident cum facilis voluptas in at placeat possimus pariatur laborum. Possimus distinctio occaecat reprehenderit officia assumenda illum adipiscing libero quibusdam.

Vero tempor aut consequat exercitation cum lorem tempore eum. Aut maxime eiusmod cupiditate ea nulla facere tempor omnis dolor harum incididunt proident. Dignissimos consectetur id proident est qui molestias.

Et blanditiis exercitation placeat esse et aut est. In libero eu vel quos adipiscing ad pariatur. Quod dignissimos eos vel dolorum vel sed at ducimus eu.

Lorem ipsum dolor sit amet consectetur adipiscing elit. In eu anim magna aut imperdiet qui animi ullamco dolorem temporibus excepteur. Ut facilis et nisi cumque in veniam deserunt.

Sunt temporibus ducimus non vero voluptas mollit. Est proident ullamco et et quas qui officia eum qui minus irure repellendus. Dolores voluptatum optio eligendi elit culpa deleniti.

Est nulla sint facilis lorem qui mollitia et mollitia qui sit est. Eiusmod fuga facilis duis enim officia proident at dolorem sunt illum eiusmod occaecat. Placeat ducimus corrupti dolore mollit exercitation nulla eiusmod incididunt duis at incididunt. Sunt non similique provident cum facilis voluptas in at placeat possimus pariatur laborum. Possimus distinctio occaecat reprehenderit officia assumenda illum adipiscing libero quibusdam.

Vero tempor aut consequat exercitation cum lorem tempore eum. Aut maxime eiusmod cupiditate ea nulla facere tempor omnis dolor harum incididunt proident. Dignissimos consectetur id proident est qui molestias.

Et blanditiis exercitation placeat esse et aut est. In libero eu vel quos adipiscing ad pariatur. Quod dignissimos eos vel dolorum vel sed at ducimus eu.
        `,
        state: 'ready',
      }),
    ),
  )
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [currentPageId, setCurrentPageId] = useState('')
  const [pageViewMode, setPageViewMode] = useState<PageViewModeType>('image')

  return (
    <NewBookContext.Provider
      value={{
        pages,
        setPages,
        selectedPages,
        setSelectedPages,
        currentPageId,
        setCurrentPageId,
        pageViewMode,
        setPageViewMode,
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
