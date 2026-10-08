import { DefaultPressable } from '@/components/ui/pressable'
import { Section } from '@/components/ui/section'
import { useAppContext } from '@/context/app-context'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { ArrowRight } from 'lucide-react-native'
import { View } from 'react-native'
import {
  SubscriptionDescription,
  SubscriptionPlanName,
  SubscriptionPrice,
  SubscriptionRenewal,
} from '../subscription/subscription-item'

export function SubscriptionSettings() {
  const { userSubscription } = useAppContext()

  const subscription = userSubscription.subscription

  if (!subscription) {
    return null
  }

  return (
    <Section heading='Subscription'>
      <View className='gap-4'>
        <View className='flex-row items-center justify-between'>
          <SubscriptionPlanName plan={subscription.plan} />
          <SubscriptionPrice billing_cycle={subscription.plan.billing_cycle} />
        </View>
        <SubscriptionDescription plan={subscription.plan} />
        <SubscriptionRenewal timestamp={subscription.renews_on} />
        <ManageSubscriptionPressable />
      </View>
    </Section>
  )
}

function ManageSubscriptionPressable() {
  const navigateToSubscriptions = () => {
    router.push('/(protected)/settings/subscription')
  }

  return (
    <DefaultPressable
      text='Manage subscription'
      onPress={navigateToSubscriptions}
      Icon={ArrowRight}
    />
  )
}

ensureInterop([ArrowRight])
