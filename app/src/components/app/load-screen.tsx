import { Image } from 'expo-image'
import { View } from 'react-native'

const appIcon = require('@/assets/images/bookshelf-icon.svg')

export function LoadScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-bg-primary'>
      <Image
        source={appIcon}
        className='animate-pulse'
        style={{
          width: 128,
          height: 128,
        }}
        contentFit='contain'
      />
    </View>
  )
}
