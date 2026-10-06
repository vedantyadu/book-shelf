import { GoogleSansText } from '@/components/ui/fonts'
import { Section } from '@/components/ui/section'
import { Pressable } from 'react-native'

export function Logout() {
  return (
    <Section>
      <Pressable className='items-center justify-center'>
        <GoogleSansText
          variant='semi-bold'
          className='text-red-400'
        >
          Logout
        </GoogleSansText>
      </Pressable>
    </Section>
  )
}
