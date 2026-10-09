import { SafeScreen } from '@/components/app/app-layout'
import {
  AddBookPressable,
  HomeScreenTopBar,
} from '@/components/screens/home/home-items'
import { ensureInterop } from '@/utils/icon-interop'
import { Plus, Settings } from 'lucide-react-native'

export default function HomeScreen() {
  return (
    <SafeScreen topPadding>
      <HomeScreenTopBar />
      <AddBookPressable />
    </SafeScreen>
  )
}

ensureInterop([Settings, Plus])
