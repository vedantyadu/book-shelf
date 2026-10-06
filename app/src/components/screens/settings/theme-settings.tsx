import { SettingSelect } from '@/components/app/settings-select'
import { Section } from '@/components/ui/section'
import { ThemeType, useThemeContext } from '@/context/theme-context'
import { ensureInterop } from '@/utils/icon-interop'
import { Moon, Sun, SunMoon } from 'lucide-react-native'

export function ThemeSettings() {
  const { currentTheme, changeCurrentTheme } = useThemeContext()

  return (
    <Section heading='Theme'>
      <SettingSelect
        options={[
          {
            label: 'Light',
            value: 'light',
            icon: Sun,
          },
          {
            label: 'Dark',
            value: 'dark',
            icon: Moon,
          },
          {
            label: 'System',
            value: 'system',
            icon: SunMoon,
          },
        ]}
        value={currentTheme}
        onChange={(value) => {
          changeCurrentTheme(value as ThemeType)
        }}
      />
    </Section>
  )
}

ensureInterop([Moon, Sun, SunMoon])
