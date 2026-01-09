import { NextRequest, NextResponse } from 'next/server';
import {
  sendAlertNotification,
  sendTransactionNotification,
  sendDefectNotification,
  isEmailConfigured,
  AlertEmailData,
  TransactionEmailData,
  DefectEmailData,
} from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please set RESEND_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, to, data } = body;

    // Validate required fields
    if (!type || !to || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, to, data' },
        { status: 400 }
      );
    }

    // Validate email recipients
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || recipients.some((email: string) => !email.includes('@'))) {
      return NextResponse.json(
        { success: false, error: 'Invalid email recipient(s)' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'alert':
        result = await sendAlertNotification(recipients, data as AlertEmailData);
        break;
      case 'transaction':
        result = await sendTransactionNotification(recipients, data as TransactionEmailData);
        break;
      case 'defect':
        result = await sendDefectNotification(recipients, data as DefectEmailData);
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid notification type: ${type}. Valid types: alert, transaction, defect` },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check email configuration status
export async function GET() {
  return NextResponse.json({
    configured: isEmailConfigured(),
    message: isEmailConfigured() 
      ? 'Email service is configured and ready' 
      : 'Email service not configured. Set RESEND_API_KEY in environment variables.',
  });
}
