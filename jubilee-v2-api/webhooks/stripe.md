# Stripe Webhooks

### For Charges:

- **payment_intent.succeeded**: The payment was successful.
- **payment_intent.payment_failed**: The payment failed and the payment method was not charged.
-

### For Subscriptions:

- **customer.subscription.created**: A new subscription has been created.
- **customer.subscription.updated**: A subscription was updated.
- **customer.subscription.deleted**: A subscription has been deleted.
- **invoice.payment_succeeded**: The invoice for a subscription was successfully paid.
- **invoice.payment_failed**: The payment of the invoice for a subscription failed.

## New events for payment history

Include all these events to be able to properly capture all the payment and subscription history.

- **payment_intent.canceled**
- **payment_intent.created**
- **payment_intent.payment_failed**
- **payment_intent.processing**
- **payment_intent.requires_action**
- **payment_intent.succeeded**
- **customer.subscription.created**
- **customer.subscription.deleted**
- **customer.subscription.updated**
- **charge.refunded**
