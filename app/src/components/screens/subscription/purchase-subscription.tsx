import { DefaultPressable } from '@/components/ui/pressable'
import { Section } from '@/components/ui/section'
import { SubscriptionPlanType } from '@/types/subscription'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { Gem } from 'lucide-react-native'
import { View } from 'react-native'
import {
  SubscriptionAlert,
  SubscriptionDescription,
  SubscriptionPlanName,
  SubscriptionPrice,
} from './subscription-item'

export function PurchaseSubscription({
  plan,
  plan_id,
}: {
  plan: SubscriptionPlanType
  plan_id: string
}) {
  return (
    <Section>
      <View className='gap-4'>
        <View className='flex-row items-center justify-between'>
          <SubscriptionPlanName plan={plan} />
          <SubscriptionPrice billing_cycle={plan.billing_cycle} />
        </View>
        <SubscriptionDescription plan={plan} />
        <SubscriptionAlert text='Your current subscription will be cancelled upon purchasing this plan.' />
        <PurchasePlanPressable plan_id={plan_id} />
      </View>
    </Section>
  )
}

function PurchasePlanPressable({ plan_id }: { plan_id: string }) {
  const purchasePlan = () => {
    router.push({
      pathname: '/(protected)/settings/subscription/purchase/payment',
      params: {
        plan_id: plan_id,
      },
    })
  }

  return (
    <DefaultPressable
      variant='brand'
      text='Proceed to payment'
      onPress={purchasePlan}
      Icon={Gem}
    />
  )
}

ensureInterop([Gem])
