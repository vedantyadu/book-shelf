import { GoogleSansText } from '@/components/ui/fonts'
import { Section } from '@/components/ui/section'
import { useAppContext } from '@/context/app-context'
import { View } from 'react-native'

export function AccountSettings() {
  const { auth } = useAppContext()

  const user = auth.user

  return (
    <Section heading='Account'>
      <View className='flex-row items-center gap-2'>
        <GoogleSansText>{user?.email}</GoogleSansText>
      </View>
    </Section>
  )
}
