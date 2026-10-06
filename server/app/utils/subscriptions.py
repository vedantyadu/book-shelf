from datetime import timedelta

from app.core.subscription_plans import BillingCycleEnum, SubscriptionPlan


def subscription_expires_at(plan: SubscriptionPlan) -> int | None:
    match plan.billing_cycle.cycle:
        case BillingCycleEnum.YEARLY.value:
            return (timedelta(days=365)).timestamp()
        case BillingCycleEnum.MONTHLY.value:
            return (timedelta(days=30)).timestamp()
        case BillingCycleEnum.NEVER.value:
            return None
