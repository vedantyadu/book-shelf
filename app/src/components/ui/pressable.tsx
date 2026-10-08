import { ComponentType } from 'react'
import { Pressable, View } from 'react-native'
import { twMerge } from 'tailwind-merge'
import { GoogleSansText } from './fonts'

type DefaultPressableVariants =
  'primary' | 'secondary' | 'destructive' | 'brand'

export function DefaultPressable({
  variant = 'primary',
  text,
  onPress,
  Icon,
  disabled = false,
  className,
  children,
}: {
  variant?: DefaultPressableVariants
  text?: string
  onPress: () => void
  Icon?: ComponentType<{ className?: string }>
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}) {
  let bg_color: string
  let text_color: string
  let icon_color: string

  switch (variant) {
    case 'secondary':
      bg_color = 'bg-neutral-300 dark:bg-neutral-700'
      text_color = 'text-neutral-100 dark:text-neutral-100'
      icon_color = 'text-neutral-100 dark:text-neutral-100'
      break
    case 'destructive':
      bg_color = 'bg-bg-highlight'
      text_color = 'text-red-500 dark:text-red-400'
      icon_color = 'text-red-500 dark:text-red-400'
      break
    case 'brand':
      bg_color = 'bg-brand-primary'
      text_color = 'text-neutral-100'
      icon_color = 'text-neutral-100'
      break
    default:
      bg_color = 'bg-bg-highlight'
      text_color = 'text-neutral-600 dark:text-neutral-200'
      icon_color = 'text-neutral-600 dark:text-neutral-200'
      break
  }

  const InnerContent = () => {
    if (children) {
      return children
    }
    return (
      <>
        <GoogleSansText
          variant='semi-bold'
          className={`text-lg ${text_color}`}
        >
          {text}
        </GoogleSansText>
        {Icon && (
          <View className='size-4 justify-center items-center'>
            <Icon className={`size-4 ${icon_color}`} />
          </View>
        )}
      </>
    )
  }

  return (
    <Pressable
      className={twMerge(
        `flex-row items-center gap-2 justify-center py-3 px-4 rounded-xl ${bg_color} ${disabled ? 'opacity-50' : ''}`,
        className,
      )}
      onPress={onPress}
      disabled={disabled}
    >
      <InnerContent />
    </Pressable>
  )
}
