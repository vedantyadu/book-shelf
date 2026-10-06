import { GoogleSansText } from '@/components/ui/fonts'
import { Section } from '@/components/ui/section'
import { useAppContext } from '@/context/app-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { Gem } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import {
  SubscriptionDescription,
  SubscriptionExpiry,
  SubscriptionPlanName,
  SubscriptionPrice,
} from '../subscription/subscription-item'

export function SubscriptionSettings() {
  const { userSubscription } = useAppContext()

  const subscription = userSubscription.subscription

  if (!subscription) {
    return null
  }

  return (
    <Section heading='Subscription'>
      <View className='flex-row items-center justify-between mb-2'>
        <SubscriptionPlanName plan={subscription.plan} />
        <SubscriptionPrice billing_cycle={subscription.plan.billing_cycle} />
      </View>
      <View className='mb-2'>
        <SubscriptionDescription plan={subscription.plan} />
      </View>
      <View className='mb-2'>
        <SubscriptionExpiry timestamp={subscription.expires_at} />
      </View>
      <ManageSubscriptionPressable />
    </Section>
  )
}

function ManageSubscriptionPressable() {
  const navigateToSubscriptions = () => {
    router.push('/(protected)/settings/subscription')
  }

  return (
    <Pressable
      className='flex-row items-center gap-2 justify-center p-3 bg-brand-primary rounded-xl'
      onPress={navigateToSubscriptions}
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-neutral-100 text-lg'
      >
        Manage subscription
      </GoogleSansText>
      <Gem className='text-neutral-100 size-5' />
    </Pressable>
  )
}

ensureInterop([Gem])
