import { SafeScreen } from '@/components/app/app-layout'
import {
  AddBookPressable,
  HomeScreenTopBar,
} from '@/components/screens/home/home-items'
import { useScanContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { Plus, Settings } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { scanPage } from '../../../modules/page-scan-module/src/PageScanModule'

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { setScanResult } = useScanContext()

  const openPageScanner = async () => {
    const scanResult = await scanPage()
    if (!scanResult) return

    setScanResult(scanResult)
    router.push('/(protected)/scan-result')
  }

  return (
    <SafeScreen topPadding>
      <HomeScreenTopBar />

      <AddBookPressable />
    </SafeScreen>
  )
}

ensureInterop([Settings, Plus])
