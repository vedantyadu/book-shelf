import { GoogleSansText } from '@/components/ui/fonts'
import { Section } from '@/components/ui/section'
import { api } from '@/lib/api'
import { SubscriptionPlanType } from '@/types/subscription'
import { ensureInterop } from '@/utils/icon-interop'
import { Check } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import RazorpayCheckout, { CheckoutOptions } from 'react-native-razorpay'
import {
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
      {plan && (
        <View className='gap-4'>
          <View className='flex-row items-center justify-between'>
            <SubscriptionPlanName plan={plan} />
            <SubscriptionPrice billing_cycle={plan.billing_cycle} />
          </View>
          <SubscriptionDescription plan={plan} />
          <PurchasePlanPressable plan_id={plan_id} />
        </View>
      )}
    </Section>
  )
}

function PurchasePlanPressable({ plan_id }: { plan_id: string }) {
  const purchasePlan = async () => {
    try {
      const res = await api.post(`/subscriptions/plans/${plan_id}/purchase`)

      const options = {
        subscription_id: res.data.subscription_id,
        key: res.data.key,
        name: 'Bookshelf',
        description: res.data.plan_name,
        theme: { color: '#3b82f6' },
      }

      RazorpayCheckout.open(options as CheckoutOptions)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Pressable
      className='flex-row items-center gap-2 justify-center p-3 bg-brand-primary rounded-xl'
      onPress={purchasePlan}
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-neutral-100 text-lg'
      >
        Purchase plan
      </GoogleSansText>
      <View className='size-4 items-center justify-center'>
        <Check className='text-neutral-100 size-4' />
      </View>
    </Pressable>
  )
}

ensureInterop([Check])
