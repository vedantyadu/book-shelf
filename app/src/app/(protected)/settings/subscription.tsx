import { BottomBar, SafeScreen } from '@/components/app/app-layout'
import { LoadScreen } from '@/components/app/load-screen'
import { SubscriptionItem } from '@/components/screens/subscription/subscription-item'
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
      {loading ? (
        <LoadScreen />
      ) : (
        <ScrollView
          className='flex-1'
          showsVerticalScrollIndicator={false}
        >
          <View className='gap-4 px-4'>
            {userSubscription.subscription && (
              <SubscriptionItem
                plan={userSubscription.subscription?.plan}
                plan_id={userSubscription.subscription?.id}
              />
            )}
            {Object.entries(subscriptionPlans)
              .filter(
                ([plan_id, plan]) =>
                  plan_id !== userSubscription?.subscription?.id,
              )
              .map(([plan_id, plan]) => (
                <SubscriptionItem
                  key={plan_id}
                  plan={plan}
                  plan_id={plan_id}
                />
              ))}
          </View>
        </ScrollView>
      )}
      <BottomBar />
    </SafeScreen>
  )
}
