import { AccountSettings } from '@/components/screens/settings/account-settings'
import { Logout } from '@/components/screens/settings/logout'
import { SubscriptionSettings } from '@/components/screens/settings/subscription-settings'
import { ThemeSettings } from '@/components/screens/settings/theme-settings'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Settings() {
  const insets = useSafeAreaInsets()

  return (
    <View
      className='flex-1 bg-bg-primary gap-4 px-4'
      style={{
        paddingTop: insets.top + 16,
      }}
    >
      <AccountSettings />
      <SubscriptionSettings />
      <ThemeSettings />
      <Logout />
    </View>
  )
}
