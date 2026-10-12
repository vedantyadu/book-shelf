import { ZoomableImage } from '@/components/app/zoomable-image'
import { PageType } from '@/context/new-book-context'
import { View } from 'react-native'

export function NewBookPageView({ page }: { page: PageType }) {
  return (
    <View className='flex-1'>
      <ZoomableImage
        source={page.uri}
        className='absolute inset-0'
        imageClassName='w-full'
      />
    </View>
  )
}
