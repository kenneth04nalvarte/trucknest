import { NextResponse } from 'next/server'
import NotificationService from '@/services/NotificationService'

export async function GET() {
  try {
    // Verify cron secret to ensure only authorized calls
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      throw new Error('CRON_SECRET environment variable not set')
    }

    // Process scheduled notifications
    await NotificationService.sendScheduledNotifications()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing notifications:', error)
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    )
  }
}

// Configure route to run every minute
export const dynamic = 'force-dynamic'
export const revalidate = 0 