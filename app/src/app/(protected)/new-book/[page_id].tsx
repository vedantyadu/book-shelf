import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import { NewBookPageView } from '@/components/screens/new-book/new-book-page-view'
import { useNewBookContext } from '@/context/new-book-context'
import { useLocalSearchParams } from 'expo-router'

export default function NewBookPageScreen() {
  const { page_id } = useLocalSearchParams<{ page_id: string }>()
  const { pages } = useNewBookContext()

  const page = pages.find((p) => p.id === page_id)
  const index = pages.findIndex((p) => p.id === page_id)

  return (
    <SafeScreen>
      <TopBar title={`Page ${index + 1}`} />
      {page && <NewBookPageView page={page} />}
      <BottomBar />
    </SafeScreen>
  )
}
