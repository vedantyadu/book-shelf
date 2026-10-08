export type BillingCycleEnum = 'monthly' | 'yearly' | 'never'
export type FeatureEnum = 'cloud_storage' | 'ai_assistant'

export interface Feature {
  name: FeatureEnum
  limit: number
  unit: string
}

export interface Price {
  amount: number
  currency: string
}

export interface BillingCycle {
  cycle: BillingCycleEnum
  price: Price[]
}

export interface Colors {
  bg_color: string
  text_color: string
}

export interface Metadata {
  razorpay_plan_id: string
  colors: Colors
  description: string[]
}

export interface SubscriptionPlanType {
  name: string
  default: boolean
  active: boolean
  features: Feature[]
  billing_cycle: BillingCycle
  metadata: Metadata
}

export type SubscriptionPlansDataType = {
  [plan_id: string]: SubscriptionPlanType
}

export type SubscriptionType = {
  id: string
  plan: SubscriptionPlanType
  renews_on: number | null
  billing_cycle: BillingCycleEnum
}
