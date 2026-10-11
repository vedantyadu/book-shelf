import { ensureInterop } from '@/utils/icon-interop'
import { CircleAlert } from 'lucide-react-native'
import { View } from 'react-native'
import { GoogleSansText } from '../ui/fonts'

type TextAlertVariantType = 'default' | 'muted' | 'error'

export default function TextAlert({
  text,
  variant = 'default',
  size = 'sm',
}: {
  text: string
  variant?: TextAlertVariantType
  size?: 'xs' | 'sm'
}) {
  let iconColor
  let textColor
  let textClassName
  let iconSize
  let gap

  switch (size) {
    case 'xs':
      textClassName = 'text-xs'
      iconSize = 'size-3'
      gap = 'gap-1'
      break
    case 'sm':
      textClassName = 'text-sm'
      iconSize = 'size-4'
      gap = 'gap-2'
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
    case 'error':
      iconColor = 'text-red-500'
      textColor = 'text-red-500'
      break
  }

  return (
    <View className={`flex-row ${gap} items-center`}>
      <View className={`${iconSize} items-center justify-center`}>
        <CircleAlert className={`${iconColor} ${iconSize}`} />
      </View>
      <GoogleSansText className={`${textClassName} ${textColor} flex-1`}>
        {text}
      </GoogleSansText>
    </View>
  )
}

ensureInterop([CircleAlert])
