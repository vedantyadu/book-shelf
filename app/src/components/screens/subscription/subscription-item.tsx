import { GoogleSansText } from '@/components/ui/fonts'
import { useAppContext } from '@/context/app-context'
import { SubscriptionType } from '@/types/subscription'
import { formatDateFromSecondsTimestamp } from '@/utils/date-time'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import { Asterisk, CalendarClock, Gem, X } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export function SubscriptionItem({
  plan,
  plan_id,
  expires_at,
}: {
  plan: SubscriptionType['plan']
  plan_id: string
  expires_at?: SubscriptionType['expires_at']
}) {
  const { userSubscription } = useAppContext()

  const isCurrentPlan = userSubscription.subscription?.id === plan_id

  const RenderButton = () => {
    if (plan.default) {
      return null
    }
    if (isCurrentPlan) {
      return <CancelSubscription plan_id={plan_id} />
    }
    return <SelectSubscriptionPressable plan_id={plan_id} />
  }

  return (
    <View className='gap-4'>
      <View className='flex-row items-center justify-between'>
        <SubscriptionPlanName plan={plan} />
        <SubscriptionPrice billing_cycle={plan.billing_cycle} />
      </View>
      <SubscriptionDescription plan={plan} />

      {expires_at !== undefined && (
        <SubscriptionExpiry timestamp={expires_at} />
      )}

      <RenderButton />
    </View>
  )
}

export function SubscriptionPlanName({
  plan,
}: {
  plan: SubscriptionType['plan']
}) {
  return (
    <View
      className='px-3 py-1 rounded-xl'
      style={{
        backgroundColor: plan.metadata.colors.bg_color,
      }}
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-sm'
        style={{
          color: plan.metadata.colors.text_color,
        }}
      >
        {plan.name}
      </GoogleSansText>
    </View>
  )
}

export function SubscriptionDescription({
  plan,
}: {
  plan: SubscriptionType['plan']
}) {
  const description = plan.metadata.description
  return (
    <View className='gap-1'>
      {description.map((item, index) => {
        return (
          <View
            key={index}
            className='flex-row gap-2 items-start'
          >
            <View className='justify-center items-center size-3 mt-1'>
              <Asterisk className='text-text-secondary size-3 stroke-2' />
            </View>
            <View className='flex-1'>
              <GoogleSansText
                variant='medium'
                key={index}
              >
                {item}
              </GoogleSansText>
            </View>
          </View>
        )
      })}
    </View>
  )
}

export function SubscriptionExpiry({
  timestamp,
}: {
  timestamp: SubscriptionType['expires_at']
}) {
  return (
    <View className='flex-row items-center gap-1'>
      <View className='items-center justify-center size-4'>
        <CalendarClock className='text-text-secondary size-4' />
      </View>
      <GoogleSansText className='text-sm text-text-secondary'>
        {timestamp ? 'Valid until' : 'Valid'}
      </GoogleSansText>
      <GoogleSansText
        variant='semi-bold'
        className='text-sm'
      >
        {timestamp ? formatDateFromSecondsTimestamp(timestamp) : 'Forever'}
      </GoogleSansText>
    </View>
  )
}

function SelectSubscriptionPressable({ plan_id }: { plan_id: string }) {
  const onPurchasePress = () => {
    router.push({
      pathname: '/(protected)/settings/subscription/purchase-plan',
      params: {
        plan_id,
      },
    })
  }

  return (
    <Pressable
      className='flex-row items-center gap-2 justify-center p-3 rounded-xl bg-brand-primary'
      onPress={onPurchasePress}
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-neutral-100 text-lg'
      >
        Select plan
      </GoogleSansText>
      <View className='size-4 justify-center items-center'>
        <Gem className='text-neutral-100 size-4' />
      </View>
    </Pressable>
  )
}

function CancelSubscription({ plan_id }: { plan_id: string }) {
  return (
    <Pressable className='flex-row items-center gap-2 justify-center p-3 rounded-xl bg-red-500'>
      <GoogleSansText
        variant='semi-bold'
        className='text-neutral-100 text-lg'
      >
        Cancel subscription
      </GoogleSansText>
      <View className='size-4 justify-center items-center'>
        <X className='text-neutral-100 size-4' />
      </View>
    </Pressable>
  )
}

export function SubscriptionPrice({
  billing_cycle,
}: {
  billing_cycle: SubscriptionType['plan']['billing_cycle']
}) {
  return (
    <View className='flex-row items-center gap-1'>
      <GoogleSansText
        variant='semi-bold'
        className='text-sm text-green-600'
      >
        {billing_cycle.price[0].currency} {billing_cycle.price[0].amount}
      </GoogleSansText>
      <GoogleSansText className='text-sm text-text-secondary'>
        {billing_cycle.cycle === 'yearly' ? '/ Year' : '/ Month'}
      </GoogleSansText>
    </View>
  )
}

ensureInterop([CalendarClock, Asterisk, X, Gem])
