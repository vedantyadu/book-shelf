import { GoogleSansText } from '@/components/ui/fonts'
import { Section } from '@/components/ui/section'
import { useAppContext } from '@/context/app-context'
import { SubscriptionType } from '@/types/subscription'
import { formatDateFromSecondsTimestamp } from '@/utils/date-time'
import { ensureInterop } from '@/utils/icon-interop'
import { Asterisk, CalendarClock } from 'lucide-react-native'
import { Pressable, View } from 'react-native'

export function SubscriptionItem({
  plan,
  plan_id,
}: {
  plan: SubscriptionType['plan']
  plan_id: string
}) {
  const { userSubscription } = useAppContext()

  const isCurrentPlan = userSubscription.subscription?.id === plan_id
  const expiresAt = userSubscription.subscription?.expires_at ?? null

  return (
    <Section heading={isCurrentPlan ? 'Current plan' : undefined}>
      <View className='flex-row items-center justify-between mb-2'>
        <SubscriptionPlanName plan={plan} />
        <SubscriptionPrice billing_cycle={plan.billing_cycle} />
      </View>
      <View className='mb-2'>
        <SubscriptionDescription plan={plan} />
      </View>

      {isCurrentPlan && (
        <View className='mb-2'>
          <SubscriptionExpiry timestamp={expiresAt} />
        </View>
      )}
      {isCurrentPlan ? (
        <CancelSubscription plan_id={plan_id} />
      ) : (
        <PurchaseSubscription
          currentPlan={isCurrentPlan}
          plan_id={plan_id}
        />
      )}
    </Section>
  )
}

export function SubscriptionPlanName({
  plan,
}: {
  plan: SubscriptionType['plan']
}) {
  return (
    <View
      className='px-2 py-0.5 rounded-lg'
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
              <GoogleSansText key={index}>{item}</GoogleSansText>
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

function PurchaseSubscription({
  currentPlan,
  plan_id,
}: {
  currentPlan: boolean
  plan_id: string
}) {
  return (
    <Pressable
      className={`flex-row items-center gap-2 justify-center p-3 rounded-xl bg-brand-primary ${
        currentPlan ? 'opacity-50' : ''
      }`}
    >
      <GoogleSansText
        variant='semi-bold'
        className='text-neutral-100 text-lg'
      >
        {currentPlan ? 'Active plan' : 'Select plan'}
      </GoogleSansText>
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

ensureInterop([CalendarClock, Asterisk])
