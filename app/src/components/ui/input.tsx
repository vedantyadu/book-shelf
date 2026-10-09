import { GoogleSansText } from '@/components/ui/fonts'
import { ensureInterop } from '@/utils/icon-interop'
import { Asterisk } from 'lucide-react-native'
import { TextInput, View } from 'react-native'

export function TextInputField({
  label,
  placeholder,
  className,
  style,
  required,
  ...props
}: React.ComponentProps<typeof TextInput> & {
  label?: string
  required?: boolean
}) {
  return (
    <View className='gap-1'>
      {label && (
        <View className='flex-row items-center'>
          <GoogleSansText className='text-sm text-neutral-500'>
            {label}
          </GoogleSansText>
          {required && (
            <View className='-mt-1'>
              <Asterisk
                className='text-neutral-500 size-2'
                fill='currentColor'
              />
            </View>
          )}
        </View>
      )}
      <TextInput
        placeholder={placeholder}
        textAlignVertical='center'
        style={[{ includeFontPadding: false }, style]}
        className={`h-12 bg-bg-highlight text-text-primary rounded-xl px-4 py-3 placeholder:text-icon font-googlesans-regular text-sm ${className ?? ''}`}
        {...props}
      />
    </View>
  )
}

ensureInterop([Asterisk])
