import { GoogleSansText } from '@/components/ui/fonts'
import { ensureInterop, IconComponent } from '@/utils/icon-interop'
import { Check } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export type SettingOption = {
  label: string
  value: string
  icon?: IconComponent
}

export function SettingSelect({
  options,
  value,
  onChange,
}: {
  options: SettingOption[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <View>
      {options.map((option, idx) => {
        const Icon = option.icon
        return (
          <Pressable
            className='flex-row items-center justify-between py-3'
            onPress={() => onChange(option.value)}
            key={idx}
          >
            <View className='flex-row items-center gap-2'>
              {Icon && (
                <View className='size-4 justify-center items-center'>
                  <Icon
                    className={`size-4 ${
                      value === option.value
                        ? 'text-text-secondary'
                        : 'text-icon'
                    }`}
                  />
                </View>
              )}
              <GoogleSansText
                variant={value == option.value ? 'medium' : 'regular'}
                className={`text-sm ${value === option.value ? 'text-text-primary' : 'text-text-secondary'}`}
              >
                {option.label}
              </GoogleSansText>
            </View>
            {value === option.value && (
              <View className='size-4 items-center justify-center'>
                <Check className='text-green-500 size-4' />
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

ensureInterop([Check])
