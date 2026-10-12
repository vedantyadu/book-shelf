import { SafeScreen } from '@/components/app/app-layout'
import {
  NewBookPageBottomBar,
  NewBookPageTopBar,
  NewBookPageView,
} from '@/components/screens/new-book/new-book-page-view'
import { useNewBookContext } from '@/context/new-book-context'
import { useLocalSearchParams } from 'expo-router'

export default function NewBookPageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { pages } = useNewBookContext()

  return (
    <SafeScreen>
      <NewBookPageTopBar />
      <NewBookPageView />
      <NewBookPageBottomBar />
    </SafeScreen>
  )
}
