import { GoogleSansText } from '@/components/ui/fonts'
import { useScanContext } from '@/context/scan-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { Plus, Settings } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
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
    <View
      className='flex-1 bg-bg-primary relative'
      style={{ paddingTop: insets.top }}
    >
      <View className='p-4 flex-1'>
        <View className='flex-row w-full items-center justify-between'>
          <GoogleSansText
            variant='bold'
            className='text-3xl'
          >
            Your Library
          </GoogleSansText>
          <Pressable
            className='items-center justify-center p-2 rounded-full'
            onPress={() => router.push('/(protected)/settings')}
          >
            <Settings className='text-text-primary size-6' />
          </Pressable>
        </View>
      </View>

      <Pressable
        className='absolute flex-row gap-4 px-4 py-3 items-center justify-center bg-bg-secondary rounded-xl left-4 right-4'
        style={{
          bottom: insets.bottom + 16,
        }}
        onPress={openPageScanner}
      >
        <Plus className='text-text-primary size-6' />
        <GoogleSansText
          variant='semi-bold'
          className='text-lg'
        >
          Add Book
        </GoogleSansText>
      </Pressable>
    </View>
  )
}

ensureInterop([Settings, Plus])
