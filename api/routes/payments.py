import os
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from api.database import get_db
from api.models import User
from api.auth import get_current_user
from api.schemas import CheckoutSessionRequest, CheckoutSessionResponse
from api.services.stripe_service import (
    create_checkout_session,
    create_customer_portal_session,
    get_stripe,
    STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET
)

load_dotenv()
logger = logging.getLogger("potato_disease_ai.payments")

router = APIRouter(tags=["Payments & Subscriptions"])

@router.get("/config")
def get_payment_config():
    """Return Stripe publishable key to frontend."""
    return {
        "publishable_key": STRIPE_PUBLISHABLE_KEY,
        "is_configured": STRIPE_PUBLISHABLE_KEY != "pk_test_placeholder"
    }

@router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
def checkout_session(
    body: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiate a Stripe Checkout session for Pro or Enterprise upgrade."""
    success_url = body.success_url or "http://localhost:5173/dashboard?payment=success"
    cancel_url = body.cancel_url or "http://localhost:5173/dashboard?payment=cancel"

    try:
        session_data = create_checkout_session(
            user_id=current_user.id,
            user_email=current_user.email,
            plan_id=body.plan_id,
            success_url=success_url,
            cancel_url=cancel_url
        )

        # In mock test mode, auto-upgrade the user for seamless testing
        if session_data.get("is_mock"):
            current_user.plan = body.plan_id
            current_user.subscription_status = "active"
            db.commit()

        return CheckoutSessionResponse(
            checkout_url=session_data["url"],
            session_id=session_data["id"],
            is_mock=session_data.get("is_mock", False)
        )
    except Exception as e:
        logger.error(f"Error initiating checkout: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customer-portal")
def customer_portal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate Stripe Customer Portal URL for managing active subscriptions."""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active Stripe customer found for this account.")

    portal_url = create_customer_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url="http://localhost:5173/dashboard"
    )
    return {"url": portal_url}

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db), stripe_signature: str = Header(None, alias="stripe-signature")):
    """Stripe webhook endpoint to handle real-time subscription status changes."""
    stripe = get_stripe()
    if not stripe:
        return {"status": "ignored_no_stripe"}

    payload = await request.body()
    event = None

    try:
        if STRIPE_WEBHOOK_SECRET:
            event = stripe.Webhook.construct_event(
                payload, stripe_signature, STRIPE_WEBHOOK_SECRET
            )
        else:
            import json
            event = json.loads(payload)
    except Exception as e:
        logger.error(f"Webhook signature error: {e}")
        raise HTTPException(status_code=400, detail=f"Webhook signature error: {e}")

    event_type = event.get("type", "")
    logger.info(f"Received Stripe event: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id") or session.get("client_reference_id")
        plan_id = session.get("metadata", {}).get("plan_id", "pro")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")

        if user_id:
            user = db.query(User).filter(User.id == int(user_id)).first()
            if user:
                user.plan = plan_id
                user.subscription_status = "active"
                user.stripe_customer_id = customer_id
                user.stripe_subscription_id = subscription_id
                db.commit()
                logger.info(f"User {user.email} successfully upgraded to {plan_id}")

    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
        if user:
            user.plan = "free"
            user.subscription_status = "canceled"
            db.commit()
            logger.info(f"User {user.email} subscription ended, reverted to free plan.")

    return {"status": "success"}
