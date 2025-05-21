import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { userId, email } = await request.json()

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'Missing userId or email' },
        { status: 400 }
      )
    }

    // 1. Create Stripe account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
    })

    // 2. Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/complete`,
      type: 'account_onboarding',
    })

    // 3. Return the onboarding link and account ID
    return NextResponse.json({ url: accountLink.url, stripeAccountId: account.id })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 