import { View } from 'react-native'
import { CircleActivityIndicator } from './activity-indicator'

export function LoadScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-bg-primary'>
      <CircleActivityIndicator />
    </View>
  )
}
