import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/app/config/firebase'
import { doc, updateDoc, addDoc, collection, getDoc } from 'firebase/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  try {
    const body = await request.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const propertyId = session.metadata?.propertyId
        const truckMemberEmail = session.customer_email
        const amount = session.amount_total
        const bookingId = session.id

        if (!propertyId || !truckMemberEmail || !amount) {
          throw new Error('Missing required session data')
        }

        // Get property details to find owner
        const propertyDoc = await getDoc(doc(db, 'properties', propertyId))
        if (!propertyDoc.exists()) {
          throw new Error('Property not found')
        }

        const propertyData = propertyDoc.data()
        const ownerId = propertyData.ownerId

        // Update booking status to confirmed
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentAmount: amount,
          paymentDate: new Date(),
          updatedAt: new Date(),
        })

        // Create notification for land member
        await addDoc(collection(db, 'notifications'), {
          userId: ownerId,
          type: 'booking_confirmed',
          status: 'unread',
          message: `A new booking for your property has been confirmed and paid!`,
          bookingId,
          propertyId,
          createdAt: new Date(),
        })

        // Create notification for truck member
        const truckMemberDoc = await getDoc(doc(db, 'users', session.customer as string))
        if (truckMemberDoc.exists()) {
          await addDoc(collection(db, 'notifications'), {
            userId: session.customer as string,
            type: 'booking_confirmed',
            status: 'unread',
            message: `Your booking has been confirmed and payment received!`,
            bookingId,
            propertyId,
            createdAt: new Date(),
          })
        }

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata?.bookingId

        if (bookingId) {
          await updateDoc(doc(db, 'bookings', bookingId), {
            paymentStatus: 'paid',
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          })
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata?.bookingId

        if (bookingId) {
          await updateDoc(doc(db, 'bookings', bookingId), {
            paymentStatus: 'failed',
            paymentError: paymentIntent.last_payment_error?.message,
            updatedAt: new Date(),
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
} 