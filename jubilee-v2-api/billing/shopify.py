import json
import shopify
from django.conf import settings
from django.utils import timezone
from authentication.models import Shop
from .utils import get_subscription_price_cents, get_plan_name
from .models import SubscriptionPlan, SubscriptionIntervals, Subscription, PaymentProvider, ActiveStatus
from .constants import CURRENCY


def get_is_test(user_email: str):
    is_spocket_user = user_email.endswith("@spocket.co") or user_email.endswith("@felex.co")
    return is_spocket_user or settings.DEBUG


def graphql_charge_one_time(shop: Shop, variables: dict):
    with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        one_time_billing_query = """
            mutation appPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean!) {
              appPurchaseOneTimeCreate(name: $name, price: $price, returnUrl: $returnUrl, test: $test) {
                appPurchaseOneTime {
                    name
                    price {
                        amount
                        currencyCode
                    }
                    id
                    test
                }
                confirmationUrl
                userErrors {
                  field
                  message
                }
              }
            }
        """

        is_test = get_is_test(shop.owner.email)
        variables['test'] = is_test

        response = json.loads(shopify.GraphQL().execute(one_time_billing_query, variables))
        return response


def graphql_create_subscription(shop: Shop, variables: dict):
    with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        create_subscription_query = """
            mutation appSubscriptionCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean!, $trialDays: Int!, $interval: AppPricingInterval!) {
              appSubscriptionCreate(
                name: $name, 
                returnUrl: $returnUrl, 
                lineItems: [
                  {
                    plan: {
                      appRecurringPricingDetails: {
                        price: $price,
                        interval: $interval
                      }
                    }
                  }
                ], 
                test: $test,
                trialDays: $trialDays,
              ) {
                userErrors {
                  field
                  message
                }
                confirmationUrl
                appSubscription {
                  id
                }
              }
            }
        """

        is_test = get_is_test(shop.owner.email)
        variables['test'] = is_test

        response = json.loads(shopify.GraphQL().execute(create_subscription_query, variables))
        return response


def graphql_cancel_subscription(shop: Shop | None, subscription_id: str):
    if shop is None:
        return None
    with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        cancel_subscription_query = """
            mutation appSubscriptionCancel($id: ID!) {
              appSubscriptionCancel(id: $id) {
                userErrors {
                  field
                  message
                }
                appSubscription {
                  id
                  status
                }
              }
            }
        """

        variables = {
            'id': subscription_id,
        }

        response = json.loads(shopify.GraphQL().execute(cancel_subscription_query, variables))
        return response
    
def graphql_pause_subscription(shop: Shop, subscription_id: str):
  with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
      pause_subscription_query = """
          mutation subscriptionContractPause($id: ID!) {
            subscriptionContractPause(id: $id) {
              userErrors {
                field
                message
              }
              appSubscription {
                id
                status
              }
            }
          }
      """

      variables = {
          'id': subscription_id,
      }

      response = json.loads(shopify.GraphQL().execute(pause_subscription_query, variables))
      return response

def graphql_resume_subscription(shop: Shop, subscription_id: str):
  with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
      resume_subscription_query = """
          mutation subscriptionContractActive($id: ID!) {
            subscriptionContractActive(id: $id) {
              userErrors {
                field
                message
              }
              appSubscription {
                id
                status
              }
            }
          }
      """

      variables = {
          'id': subscription_id,
      }

      response = json.loads(shopify.GraphQL().execute(resume_subscription_query, variables))
      return response

def shopify_one_time_billing(amount_decimal: int, name: str, shop: Shop):
    one_time_billing_variables = {
        "name": name,
        "price": {"amount": amount_decimal, "currencyCode": CURRENCY},
        "returnUrl": settings.FRONTEND_URL + "/orders",
    }

    response = graphql_charge_one_time(shop, one_time_billing_variables)

    return response['data']['appPurchaseOneTimeCreate']['confirmationUrl'], response['data']['appPurchaseOneTimeCreate']['appPurchaseOneTime']['id']


def shopify_create_subscription(subscription_plan: SubscriptionPlan, shop: Shop, trial_days = None):
    name = get_plan_name(subscription_plan)
    price = get_subscription_price_cents(subscription_plan) / 100
    interval = "EVERY_30_DAYS" if subscription_plan.interval == SubscriptionIntervals.MONTHLY else "ANNUAL"

    total_trial_days = subscription_plan.trial_days

    if trial_days is not None:
        total_trial_days = int(trial_days)

    subscription_variables = {
        "name": name,
        "price": {
            "amount": price,
            "currencyCode": CURRENCY
        },
        "returnUrl": settings.FRONTEND_URL + "/?plan_id=" + str(subscription_plan.id),
        "trialDays": total_trial_days,
        "interval": interval,
    }

    response = graphql_create_subscription(shop, subscription_variables)

    if not response:
        return None, None, None

    user_errors = response.get('data', {}).get('appSubscriptionCreate', {}).get('userErrors', [])
    if user_errors:
        return None, user_errors, None
    confirmation_url = response.get('data', {}).get('appSubscriptionCreate', {}).get('confirmationUrl')
    subscription_id = response.get('data', {}).get('appSubscriptionCreate', {}).get('appSubscription', {}).get('id')

    return confirmation_url, user_errors, subscription_id


def shopify_cancel_subscription(subscription: Subscription):
    response = graphql_cancel_subscription(subscription.shop, subscription.external_id)

    if not response:
        return None, None

    user_errors = response.get('data', {}).get('appSubscriptionCancel', {}).get('userErrors', [])
    subscription_status = response.get('data', {}).get('appSubscriptionCancel', {}).get('appSubscription', {}).get('status')

    if not user_errors:
        subscription.cancelled_at = timezone.now()
        subscription.save()

    return user_errors, subscription_status


def graphql_subscription_period_end(shop: Shop, subscription_id: str):
    with shopify.Session.temp(shop.url, settings.SHOPIFY_API_VERSION, shop.shopify_access_token):
        subscription_query = """
            query GetSubscription($id: ID!) {
              node(id: $id) {
                ... on AppSubscription {
                  id
                  currentPeriodEnd
                }
              }
            }
        """

        variables = {
            'id': subscription_id,
        }

        response = json.loads(shopify.GraphQL().execute(subscription_query, variables))
        return response.get('data', {}).get('node', {})


def schedule_shopify_cancel_subscription(subscription: Subscription):
    if subscription.payment_provider != PaymentProvider.SHOPIFY:
        raise Exception("Subscription is not a Shopify subscription")
    if not subscription.external_id:
        raise Exception("Subscription does not have an external ID")
    if subscription.cancelled_at:
        return None

    now = timezone.now()
    trial_has_ended = subscription.trial_end_at is not None and subscription.trial_end_at <= now

    if trial_has_ended:
        # Cancel immediately if the trial has ended
        shopify_cancel_subscription(subscription)
        subscription.cancelled_at = now
        subscription.status = ActiveStatus.INACTIVE
        subscription.save(update_fields=["cancelled_at", "status"])
    else:
        # Schedule cancellation at period end via GraphQL
        response = graphql_subscription_period_end(subscription.shop, subscription.external_id)
        if not response.get('id'):
            return None

        subscription.cancel_at = response['currentPeriodEnd']
        subscription.save(update_fields=["cancel_at"])


def shopify_pause_subscription(subscription: Subscription):
    response = graphql_pause_subscription(subscription.shop, subscription.external_id)

    if not response:
        return None, None

    user_errors = response.get('data', {}).get('subscriptionContractPause', {}).get('userErrors', [])
    subscription_status = response.get('data', {}).get('subscriptionContractPause', {}).get('appSubscription', {}).get('status')

    return user_errors, subscription_status


def shopify_resume_subscription(subscription: Subscription):
    response = graphql_resume_subscription(subscription.shop, subscription.external_id)

    if not response:
        return None, None

    user_errors = response.get('data', {}).get('subscriptionContractResume', {}).get('userErrors', [])
    subscription_status = response.get('data', {}).get('subscriptionContractResume', {}).get('appSubscription', {}).get('status')

    return user_errors, subscription_status
