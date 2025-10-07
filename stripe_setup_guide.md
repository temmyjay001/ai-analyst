# Stripe Setup Guide for WhoPrompt

## Prerequisites
- Stripe account (sign up at https://stripe.com)
- WhoPrompt running locally or deployed

## Step 1: Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** → Add to `.env.local` as `STRIPE_SECRET_KEY`
3. Copy your **Publishable key** → Add to `.env.local` as `STRIPE_PUBLISHABLE_KEY`

## Step 2: Create Products and Prices

### Create Starter Plan

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Fill in:
   - **Name**: WhoPrompt Starter
   - **Description**: 100 queries/day, 3 database connections, 30-day history
   
4. **Monthly Price**:
   - Click "Add another price"
   - **Price**: $29
   - **Billing period**: Monthly
   - **Currency**: USD
   - Click "Save"
   - **Copy the Price ID** (starts with `price_`) → Add to `.env.local` as `STRIPE_STARTER_MONTHLY_PRICE_ID`

5. **Annual Price**:
   - Click "Add another price"
   - **Price**: $290
   - **Billing period**: Yearly
   - **Currency**: USD
   - Click "Save"
   - **Copy the Price ID** → Add to `.env.local` as `STRIPE_STARTER_ANNUAL_PRICE_ID`

### Create Growth Plan

1. Click "Add product" again
2. Fill in:
   - **Name**: WhoPrompt Growth
   - **Description**: 500 queries/day, 10 database connections, 90-day history
   
3. **Monthly Price**:
   - **Price**: $99
   - **Billing period**: Monthly
   - **Currency**: USD
   - **Copy the Price ID** → Add to `.env.local` as `STRIPE_GROWTH_MONTHLY_PRICE_ID`

4. **Annual Price**:
   - **Price**: $990
   - **Billing period**: Yearly
   - **Currency**: USD
   - **Copy the Price ID** → Add to `.env.local` as `STRIPE_GROWTH_ANNUAL_PRICE_ID`

## Step 3: Setup Webhooks

### For Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/billing/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`) → Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Production

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://yourdomain.com/api/billing/webhook`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Click "Add endpoint"
6. Copy the **Signing secret** → Add to production environment as `STRIPE_WEBHOOK_SECRET`

## Step 4: Configure Billing Portal

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Enable customer portal
3. Configure:
   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to update billing information
   - ✅ Allow customers to cancel subscriptions
   - ✅ Show proration preview
4. Click "Save changes"

## Step 5: Test the Integration

### Test Checkout

1. Start your app: `npm run dev`
2. Sign in to your account
3. Go to `/billing`
4. Click "Upgrade to Starter"
5. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
6. Complete checkout
7. Verify subscription appears in your database

### Test Webhooks

1. Make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/billing/webhook`
2. Complete a test checkout
3. Check terminal logs to see webhook events
4. Verify database updates

### Test Failed Payment

1. Use test card: `4000 0000 0000 0341` (requires authentication, will fail)
2. Verify webhook handles `invoice.payment_failed`
3. Check that user status updates correctly

### Test Cancellation

1. Go to billing page
2. Click "Manage Subscription"
3. Cancel subscription
4. Verify webhook handles `customer.subscription.deleted`
5. Check that user downgrades to free plan

## Step 6: Move to Production

1. Switch from Test mode to Live mode in Stripe dashboard
2. Get Live API keys
3. Create Live products and prices
4. Setup Live webhook endpoint
5. Update environment variables with Live keys

## Troubleshooting

### Webhook not receiving events
- Check Stripe CLI is running
- Verify webhook URL is correct
- Check webhook signing secret matches
- Look at Stripe dashboard webhook logs

### Checkout not working
- Verify Price IDs are correct
- Check NEXTAUTH_URL is set correctly
- Ensure Stripe API keys are valid

### Database not updating
- Check webhook handler logs
- Verify metadata is being passed correctly
- Ensure userId exists in database

## Testing Cards

**Successful payments**:
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard

**Failed payments**:
- `4000 0000 0000 0002` - Declined
- `4000 0000 0000 9995` - Insufficient funds

**3D Secure**:
- `4000 0025 0000 3155` - Requires authentication

More test cards: https://stripe.com/docs/testing