import os
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("potato_disease_ai.stripe")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

PLAN_PRICES = {
    "pro": {
        "name": "Potato Pro Agronomist",
        "amount": 1900,  # $19.00 USD
        "currency": "usd",
        "interval": "month",
        "description": "Unlimited leaf scans, Potato AI 2.0 reasoning, and exportable field reports."
    },
    "enterprise": {
        "name": "Commercial Enterprise Plan",
        "amount": 7900,  # $79.00 USD
        "currency": "usd",
        "interval": "month",
        "description": "Multi-seat farm team access, greenhouse API, and custom fine-tuning."
    }
}

def get_stripe():
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        return stripe
    except Exception as e:
        logger.error(f"Stripe library error: {e}")
        return None


def create_checkout_session(
    user_id: int,
    user_email: str,
    plan_id: str,
    success_url: str,
    cancel_url: str
) -> Dict[str, Any]:
    stripe = get_stripe()
    if not stripe or STRIPE_SECRET_KEY == "sk_test_placeholder":
        # Return structured mock checkout response if test key not yet added in .env
        return {
            "id": f"cs_test_mock_{user_id}_{plan_id}",
            "url": f"{success_url}?session_id=mock_session_success&plan={plan_id}",
            "is_mock": True,
            "message": "Stripe test mode initialized. Add STRIPE_SECRET_KEY to .env for live Stripe Checkout."
        }

    plan_info = PLAN_PRICES.get(plan_id, PLAN_PRICES["pro"])
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": plan_info["currency"],
                        "product_data": {
                            "name": plan_info["name"],
                            "description": plan_info["description"],
                        },
                        "unit_amount": plan_info["amount"],
                        "recurring": {"interval": plan_info["interval"]},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            customer_email=user_email,
            client_reference_id=str(user_id),
            metadata={
                "user_id": str(user_id),
                "plan_id": plan_id
            },
            success_url=success_url,
            cancel_url=cancel_url,
        )
        return {
            "id": session.id,
            "url": session.url,
            "is_mock": False
        }
    except Exception as e:
        logger.error(f"Stripe checkout creation failed: {e}")
        raise RuntimeError(f"Stripe Checkout error: {str(e)}")


def create_customer_portal_session(customer_id: str, return_url: str) -> Optional[str]:
    stripe = get_stripe()
    if not stripe or STRIPE_SECRET_KEY == "sk_test_placeholder":
        return return_url
    try:
        portal = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url
        )
        return portal.url
    except Exception as e:
        logger.error(f"Failed to create customer portal session: {e}")
        return None
