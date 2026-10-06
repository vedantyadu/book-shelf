import { BottomBar, SafeScreen, TopBar } from '@/components/app/app-layout'
import { LoadScreen } from '@/components/app/load-screen'
import { SubscriptionItem } from '@/components/screens/subscription/subscription-item'
import { Section } from '@/components/ui/section'
import { useAppContext } from '@/context/app-context'
import { api } from '@/lib/api'
import { SubscriptionPlansDataType } from '@/types/subscription'
import { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'

export default function SubscriptionScreen() {
  const { userSubscription } = useAppContext()
  const [subscriptionPlans, setSubscriptionPlans] =
    useState<SubscriptionPlansDataType>({})

  const [loading, setLoading] = useState<boolean>(true)

  const availablePlans = Object.entries(subscriptionPlans).filter(
    ([plan_id, plan]) => plan_id !== userSubscription?.subscription?.id,
  )

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const res = await api.get('subscriptions/plans')
        setSubscriptionPlans(res.data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchSubscriptionPlans()
  }, [])

  return (
    <SafeScreen>
      <TopBar title='Subscription' />
      {loading ? (
        <LoadScreen />
      ) : (
        <ScrollView
          className='flex-1'
          showsVerticalScrollIndicator={false}
        >
          <View className='gap-4 px-4'>
            {userSubscription.subscription && (
              <Section heading='Current plan'>
                <SubscriptionItem
                  plan={userSubscription.subscription?.plan}
                  plan_id={userSubscription.subscription?.id}
                  expires_at={userSubscription.subscription?.expires_at}
                />
              </Section>
            )}
            <Section heading='Available plans'>
              {availablePlans.map(([plan_id, plan], index) => (
                <View key={plan_id}>
                  <SubscriptionItem
                    plan={plan}
                    plan_id={plan_id}
                  />
                  {index !== availablePlans.length - 1 && (
                    <View className='h-px bg-icon mt-4 mb-2 text-green-' />
                  )}
                </View>
              ))}
            </Section>
          </View>
        </ScrollView>
      )}
      <BottomBar />
    </SafeScreen>
  )
}
