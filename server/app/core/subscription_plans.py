from enum import Enum

from pydantic import BaseModel, RootModel, model_validator


class BillingCycleEnum(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"
    NEVER = "never"


class FeatureEnum(str, Enum):
    CLOUD_STORAGE = "cloud_storage"
    AI_ASSISTANT = "ai_assistant"


class Feature(BaseModel):
    name: FeatureEnum
    limit: int
    unit: str


class Price(BaseModel):
    amount: int
    currency: str


class BillingCycle(BaseModel):
    cycle: BillingCycleEnum
    price: list[Price]


class Colors(BaseModel):
    bg_color: str
    text_color: str


class Metadata(BaseModel):
    razorpay_plan_id: str
    colors: Colors
    description: list[str]


class SubscriptionPlan(BaseModel):
    name: str
    default: bool
    active: bool
    features: list[Feature]
    billing_cycle: BillingCycle
    metadata: Metadata

    @model_validator(mode="after")
    def validate_default_plan(self) -> "SubscriptionPlan":
        if self.default:
            if not self.active:
                raise ValueError("Default plan must have active set to True")
            if self.billing_cycle.cycle != BillingCycleEnum.NEVER:
                raise ValueError("Default plan must have billing cycle 'never'")
            for price in self.billing_cycle.price:
                if price.amount != 0:
                    raise ValueError("Default plan price must be 0")
        return self


class SubscriptionPlans(RootModel[dict[str, SubscriptionPlan]]):
    @model_validator(mode="after")
    def check_exactly_one_default(self) -> "SubscriptionPlans":
        default_count = sum(1 for plan in self.root.values() if plan.default)
        if default_count != 1:
            raise ValueError(
                f"Exactly 1 plan must be set as default, found {default_count}"
            )
        return self


_plans_data = {
    "free_0": {
        "name": "Free",
        "default": True,
        "active": True,
        "features": [],
        "billing_cycle": {
            "cycle": "never",
            "price": [{"amount": 0, "currency": "INR"}],
        },
        "metadata": {
            "razorpay_plan_id": "",
            "colors": {
                "bg_color": "#e5e5e5",
                "text_color": "#262626",
            },
            "description": [
                "Scan & convert your books to text.",
                "Write notes on pages.",
            ],
        },
    },
    "standard_0": {
        "name": "Standard",
        "default": False,
        "active": True,
        "features": [
            {"name": "cloud_storage", "limit": 1000, "unit": "pages"},
            {"name": "ai_assistant", "limit": 1000, "unit": "queries/month"},
        ],
        "billing_cycle": {
            "cycle": "monthly",
            "price": [{"amount": 50, "currency": "INR"}],
        },
        "metadata": {
            "razorpay_plan_id": "plan_TkkIAteXdqYRsp",
            "colors": {
                "bg_color": "#22c55e",
                "text_color": "#0f172a",
            },
            "description": [
                "Scan & convert your books to text.",
                "Write notes on pages.",
                "Access your books across devices (upto 1000 pages on cloud storage).",
                "Summarize, ask questions & extract key insights using AI Assistant (upto 1000 queries/month).",
            ],
        },
    },
    "premium_0": {
        "name": "Premium Monthly",
        "default": False,
        "active": True,
        "features": [
            {"name": "cloud_storage", "limit": 20000, "unit": "pages"},
            {"name": "ai_assistant", "limit": 10000, "unit": "queries/month"},
        ],
        "billing_cycle": {
            "cycle": "monthly",
            "price": [{"amount": 150, "currency": "INR"}],
        },
        "metadata": {
            "razorpay_plan_id": "plan_TkkKyizp47RKbm",
            "colors": {
                "bg_color": "#eab308",
                "text_color": "#0f172a",
            },
            "description": [
                "Scan & convert your books to text.",
                "Write notes on pages.",
                "Access your books across devices (upto 20000 pages on cloud storage).",
                "Summarize, ask questions & extract key insights using AI Assistant (upto 10000 queries/month).",
            ],
        },
    },
    "premium_1": {
        "name": "Premium Yearly",
        "default": False,
        "active": True,
        "features": [
            {"name": "cloud_storage", "limit": 20000, "unit": "pages"},
            {"name": "ai_assistant", "limit": 10000, "unit": "queries/month"},
        ],
        "billing_cycle": {
            "cycle": "yearly",
            "price": [{"amount": 1500, "currency": "INR"}],
        },
        "metadata": {
            "razorpay_plan_id": "plan_TkkLkg7Nmbcg3y",
            "colors": {
                "bg_color": "#c084fc",
                "text_color": "#0f172a",
            },
            "description": [
                "Scan & convert your books to text.",
                "Write notes on pages.",
                "Access your books across devices (upto 20000 pages on cloud storage).",
                "Summarize, ask questions & extract key insights using AI Assistant (upto 10000 queries/month).",
                "Save 2 months of subscription fee.",
            ],
        },
    },
}

plans: dict[str, SubscriptionPlan] = SubscriptionPlans.model_validate(_plans_data).root
