import { SafeScreen } from '@/components/app/app-layout'
import {
  AddBookPressable,
  HomeScreenTopBar,
} from '@/components/screens/home/home-items'
import { ensureInterop } from '@/utils/icon-interop'
import { Plus, Settings } from 'lucide-react-native'
import { View } from 'react-native'

export default function HomeScreen() {
  return (
    <SafeScreen topPadding>
      <HomeScreenTopBar />
      <View className='flex-1'></View>
      <AddBookPressable />
    </SafeScreen>
  )
}

ensureInterop([Settings, Plus])
