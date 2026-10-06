import { GoogleSansText } from '@/components/ui/fonts'
import { ReactNode } from 'react'
import { View } from 'react-native'

export function Section({
  heading,
  children,
}: {
  heading?: string
  children: ReactNode
}) {
  return (
    <View className='rounded-xl p-4 bg-neutral-100 dark:bg-neutral-900 gap-2'>
      {heading && (
        <GoogleSansText
          className='text-lg'
          variant='bold'
        >
          {heading}
        </GoogleSansText>
      )}
      {children}
    </View>
  )
}
