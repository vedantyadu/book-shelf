import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { BookPlus, Settings } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export function HomeScreenTopBar() {
  const goToSettings = () => {
    router.push('/(protected)/settings')
  }

  return (
    <View className='px-4 pb-2'>
      <View className='flex-row w-full items-center justify-between'>
        <GoogleSansText
          variant='bold'
          className='text-3xl'
        >
          Your Library
        </GoogleSansText>
        <Pressable
          className='items-center justify-center p-2 rounded-full'
          onPress={goToSettings}
        >
          <Settings className='text-text-primary size-6' />
        </Pressable>
      </View>
    </View>
  )
}

export function AddBookPressable() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className='absolute  left-4 right-4'
      style={{
        bottom: insets.bottom + 16,
      }}
    >
      <DefaultPressable
        text='Add Book'
        Icon={BookPlus}
        variant='brand'
        onPress={() => {}}
      />
    </View>
  )
}

ensureInterop([BookPlus])
