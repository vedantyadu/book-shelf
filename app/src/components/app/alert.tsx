import { ensureInterop } from '@/utils/icon-interop'
import { CircleAlert } from 'lucide-react-native'
import { View } from 'react-native'
import { GoogleSansText } from '../ui/fonts'

type TextAlertVariantType = 'default' | 'muted'

export default function TextAlert({
  text,
  variant = 'default',
  textSize = 'sm',
}: {
  text: string
  variant?: TextAlertVariantType
  textSize?: 'xs' | 'sm'
}) {
  let iconColor
  let textColor
  let textClassName
  let topMargin

  switch (textSize) {
    case 'xs':
      textClassName = 'text-xs'
      topMargin = ''
      break
    case 'sm':
      textClassName = 'text-sm'
      topMargin = 'mt-0.5'
      break
  }

  switch (variant) {
    case 'default':
      iconColor = 'text-amber-500'
      textColor = 'text-text-secondary'
      break
    case 'muted':
      iconColor = 'text-icon'
      textColor = 'text-icon'
      break
  }

  return (
    <View className='flex-row gap-2 items-center'>
      <View className={`${topMargin}`}>
        <CircleAlert className={`${iconColor} size-4`} />
      </View>
      <GoogleSansText className={`${textClassName} ${textColor} flex-1`}>
        {text}
      </GoogleSansText>
    </View>
  )
}

ensureInterop([CircleAlert])
