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
      console.error('Email API: RESEND_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Email service not configured. Please set RESEND_API_KEY in environment variables.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, to, data } = body;

    console.log('Email API request:', { type, to, hasData: !!data });

    // Validate required fields
    if (!type || !to || !data) {
      console.error('Email API: Missing required fields', { type: !!type, to: !!to, data: !!data });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, to, data' },
        { status: 400 }
      );
    }

    // Validate email recipients
    const recipients = Array.isArray(to) ? to : [to];
    if (recipients.length === 0 || recipients.some((email: string) => !email || !email.includes('@'))) {
      console.error('Email API: Invalid recipients', { recipients });
      return NextResponse.json(
        { success: false, error: 'Invalid email recipient(s)' },
        { status: 400 }
      );
    }

    let result;

    try {
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
          console.error('Email API: Invalid type', { type });
          return NextResponse.json(
            { success: false, error: `Invalid notification type: ${type}. Valid types: alert, transaction, defect` },
            { status: 400 }
          );
      }
    } catch (sendError) {
      console.error('Email API: Error sending email:', sendError);
      return NextResponse.json(
        { 
          success: false, 
          error: sendError instanceof Error ? sendError.message : 'Failed to send email. Check server logs for details.' 
        },
        { status: 500 }
      );
    }

    if (result.success) {
      console.log('Email API: Email sent successfully');
      return NextResponse.json({ success: true, message: 'Email sent successfully' });
    } else {
      console.error('Email API: Send failed', { error: result.error });
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email API: Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
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
