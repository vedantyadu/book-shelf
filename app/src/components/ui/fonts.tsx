import { Text } from 'react-native'
import { twMerge } from 'tailwind-merge'

const variantFontMap: Record<string, string> = {
  regular: 'font-googlesans-regular',
  'regular-italic': 'font-googlesans-italic',
  medium: 'font-googlesans-medium',
  'medium-italic': 'font-googlesans-medium-italic',
  'semi-bold': 'font-googlesans-semibold',
  'semi-bold-italic': 'font-googlesans-semibold-italic',
  bold: 'font-googlesans-bold',
  'bold-italic': 'font-googlesans-bold-italic',
}

export function GoogleSansText({
  variant = 'regular',
  children,
  style,
  className,
  ...props
}: React.ComponentProps<typeof Text> & {
  variant?:
    | 'regular'
    | 'regular-italic'
    | 'medium'
    | 'medium-italic'
    | 'semi-bold'
    | 'semi-bold-italic'
    | 'bold'
    | 'bold-italic'
}) {
  const fontClass = variantFontMap[variant] || 'font-googlesans-regular'

  return (
    <Text
      className={twMerge(
        'text-text-primary leading-tight',
        fontClass,
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </Text>
  )
}
