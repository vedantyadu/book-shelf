import { GoogleSansText } from '@/components/ui/fonts'
import { DefaultPressable } from '@/components/ui/pressable'
import { useAppContext } from '@/context/app-context'
import { SubscriptionType } from '@/types/subscription'
import { formatDateFromSecondsTimestamp } from '@/utils/date-time'
import { ensureInterop } from '@/utils/icon-interop'
import { router } from 'expo-router'
import {
  ArrowRight,
  Asterisk,
  CalendarClock,
  CircleAlert,
  X,
} from 'lucide-react-native'
import { View } from 'react-native'

export function SubscriptionItem({
  plan,
  plan_id,
  renews_on,
}: {
  plan: SubscriptionType['plan']
  plan_id: string
  renews_on?: SubscriptionType['renews_on']
}) {
  const { userSubscription } = useAppContext()

  const isCurrentPlan = userSubscription.subscription?.id === plan_id

  const RenderButton = () => {
    if (isCurrentPlan) {
      if (plan.default) {
        return null
      }
      return <CancelSubscription />
    }

    if (plan.default) {
      return <SubscriptionAlert text='This is the default plan.' />
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

      {renews_on !== undefined && <SubscriptionRenewal timestamp={renews_on} />}

      <RenderButton />
    </View>
  )
}

export function SubscriptionAlert({ text }: { text: string }) {
  return (
    <View className='flex-row gap-2'>
      <View className='mt-0.5'>
        <CircleAlert className='text-amber-500 size-4' />
      </View>
      <GoogleSansText className='text-sm text-text-secondary flex-1'>
        {text}
      </GoogleSansText>
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
      className='px-3 py-1 rounded-full'
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

export function SubscriptionRenewal({
  timestamp,
}: {
  timestamp: SubscriptionType['renews_on']
}) {
  const getRenewalText = () => {
    if (!timestamp) {
      return { text: 'Valid', value: 'Forever' }
    }

    return {
      text: 'Auto-renews on',
      value: formatDateFromSecondsTimestamp(timestamp),
    }
  }

  const { text, value } = getRenewalText()

  return (
    <View className='flex-row items-center gap-1'>
      <View className='items-center justify-center size-4'>
        <CalendarClock className='text-text-secondary size-4' />
      </View>
      <GoogleSansText className='text-sm text-text-secondary'>
        {text}
      </GoogleSansText>
      <GoogleSansText
        variant='semi-bold'
        className='text-sm'
      >
        {value}
      </GoogleSansText>
    </View>
  )
}

function SelectSubscriptionPressable({ plan_id }: { plan_id: string }) {
  const onPurchasePress = () => {
    router.push({
      pathname: '/(protected)/settings/subscription/purchase',
      params: {
        plan_id,
      },
    })
  }

  return (
    <DefaultPressable
      text='Change plan'
      onPress={onPurchasePress}
      Icon={ArrowRight}
    />
  )
}

function CancelSubscription() {
  const onCancelPress = async () => {
    router.push('/(protected)/settings/subscription/cancel')
  }

  return (
    <DefaultPressable
      variant='destructive'
      text='Cancel subscription'
      onPress={onCancelPress}
      Icon={X}
    />
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

ensureInterop([CalendarClock, Asterisk, X, ArrowRight, CircleAlert])
