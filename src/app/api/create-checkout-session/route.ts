import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  try {
    const { amount, landMemberStripeAccountId, propertyId, truckMemberEmail } = await request.json()

    if (!amount || !landMemberStripeAccountId || !propertyId || !truckMemberEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Truck Parking Reservation',
          },
          unit_amount: amount, // in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: truckMemberEmail,
      payment_intent_data: {
        application_fee_amount: Math.round(amount * 0.15), // 15% commission
        transfer_data: {
          destination: landMemberStripeAccountId, // payout to land member
        },
        metadata: {
          propertyId,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/booking/cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 