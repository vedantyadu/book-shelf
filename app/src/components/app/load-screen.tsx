import { BRAND_PRIMARY_COLOR } from '@/utils/themes'
import { CircularProgressIndicator, Host } from '@expo/ui/jetpack-compose'
import { View } from 'react-native'

export function LoadScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-bg-primary'>
      <Host matchContents>
        <CircularProgressIndicator color={BRAND_PRIMARY_COLOR} />
      </Host>
    </View>
  )
}
