import { SafeScreen } from '@/components/app/app-layout'
import {
  AddPagesTopBar,
  PageList,
  ScanPagesBottomBar,
} from '@/components/screens/new-book/new-book-pages'

export default function NewBookPagesScreen() {
  return (
    <SafeScreen>
      <AddPagesTopBar />
      <PageList />
      <ScanPagesBottomBar />
    </SafeScreen>
  )
}
