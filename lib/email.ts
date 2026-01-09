import { Resend } from 'resend';

// Initialize Resend with API key
const resendApiKey = process.env.RESEND_API_KEY || '';

// Check if email is configured
export const isEmailConfigured = () => {
  return Boolean(resendApiKey && resendApiKey !== 'your_resend_api_key');
};

// Get Resend instance
export const getResend = () => {
  if (!isEmailConfigured()) {
    return null;
  }
  return new Resend(resendApiKey);
};

// Email templates
export interface AlertEmailData {
  materialCode: string;
  materialDescription: string;
  localQuantity: number;
  sapQuantity: number;
  variance: number;
  severity: 'warning' | 'error' | 'critical';
  createdAt: string;
}

export interface TransactionEmailData {
  transactionType: 'receiving' | 'issuance';
  materialCode: string;
  materialDescription: string;
  quantity: number;
  unit: string;
  user: string;
  reference: string;
  date: string;
}

export interface DefectEmailData {
  materialCode: string;
  materialDescription: string;
  defectType: string;
  quantity: number;
  severity: string;
  reportedBy: string;
  date: string;
}

// Generate HTML email for alerts
export const generateAlertEmailHTML = (alert: AlertEmailData): string => {
  const severityColors = {
    warning: '#f59e0b',
    error: '#f97316', 
    critical: '#ef4444'
  };
  
  const severityColor = severityColors[alert.severity];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alert Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <div style="background-color: ${severityColor}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ ${alert.severity.toUpperCase()} ALERT</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 20px;">Quantity Mismatch Detected</h2>
            <p style="color: #94a3b8; margin: 0 0 25px 0; font-size: 14px;">
              ${new Date(alert.createdAt).toLocaleString()}
            </p>
            
            <!-- Material Info -->
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #f8fafc; margin: 0 0 15px 0; font-size: 16px;">Material Information</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 8px 0; font-size: 14px;">Material Code:</td>
                  <td style="color: #f8fafc; padding: 8px 0; font-size: 14px; text-align: right; font-weight: bold;">${alert.materialCode}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 8px 0; font-size: 14px;">Description:</td>
                  <td style="color: #f8fafc; padding: 8px 0; font-size: 14px; text-align: right;">${alert.materialDescription}</td>
                </tr>
              </table>
            </div>
            
            <!-- Quantity Details -->
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px;">
              <h3 style="color: #f8fafc; margin: 0 0 15px 0; font-size: 16px;">Quantity Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 8px 0; font-size: 14px;">Local Quantity:</td>
                  <td style="color: #f8fafc; padding: 8px 0; font-size: 14px; text-align: right; font-weight: bold;">${alert.localQuantity}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 8px 0; font-size: 14px;">SAP Quantity:</td>
                  <td style="color: #f8fafc; padding: 8px 0; font-size: 14px; text-align: right; font-weight: bold;">${alert.sapQuantity}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 8px 0; font-size: 14px;">Variance:</td>
                  <td style="color: ${alert.variance > 0 ? '#10b981' : '#ef4444'}; padding: 8px 0; font-size: 14px; text-align: right; font-weight: bold;">
                    ${alert.variance > 0 ? '+' : ''}${alert.variance.toFixed(2)}
                  </td>
                </tr>
              </table>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alerts" 
                 style="display: inline-block; background-color: ${severityColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                View Alert Details
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              Auto Carpets Warehouse Management System
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML email for transactions
export const generateTransactionEmailHTML = (transaction: TransactionEmailData): string => {
  const typeColor = transaction.transactionType === 'receiving' ? '#10b981' : '#3b82f6';
  const typeLabel = transaction.transactionType === 'receiving' ? 'RECEIVING' : 'ISSUANCE';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <div style="background-color: ${typeColor}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📦 ${typeLabel} TRANSACTION</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 20px;">New Transaction Recorded</h2>
            <p style="color: #94a3b8; margin: 0 0 25px 0; font-size: 14px;">
              ${new Date(transaction.date).toLocaleString()}
            </p>
            
            <!-- Transaction Details -->
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Reference:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right; font-weight: bold;">${transaction.reference}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Material Code:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right;">${transaction.materialCode}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Description:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right;">${transaction.materialDescription}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Quantity:</td>
                  <td style="color: ${typeColor}; padding: 10px 0; font-size: 14px; text-align: right; font-weight: bold;">
                    ${transaction.transactionType === 'receiving' ? '+' : '-'}${transaction.quantity} ${transaction.unit}
                  </td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Processed By:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right;">${transaction.user}</td>
                </tr>
              </table>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/transactions" 
                 style="display: inline-block; background-color: ${typeColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                View All Transactions
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              Auto Carpets Warehouse Management System
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate HTML email for defects
export const generateDefectEmailHTML = (defect: DefectEmailData): string => {
  const severityColors: Record<string, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
  };
  
  const severityColor = severityColors[defect.severity.toLowerCase()] || '#f59e0b';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Defect Report Notification</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
          <!-- Header -->
          <div style="background-color: ${severityColor}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🔧 DEFECT REPORTED</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #f8fafc; margin: 0 0 10px 0; font-size: 20px;">${defect.defectType}</h2>
            <p style="color: #94a3b8; margin: 0 0 5px 0; font-size: 14px;">
              Severity: <span style="color: ${severityColor}; font-weight: bold;">${defect.severity.toUpperCase()}</span>
            </p>
            <p style="color: #94a3b8; margin: 0 0 25px 0; font-size: 14px;">
              ${new Date(defect.date).toLocaleString()}
            </p>
            
            <!-- Defect Details -->
            <div style="background-color: #0f172a; border-radius: 8px; padding: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Material Code:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right; font-weight: bold;">${defect.materialCode}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Description:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right;">${defect.materialDescription}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Affected Quantity:</td>
                  <td style="color: #ef4444; padding: 10px 0; font-size: 14px; text-align: right; font-weight: bold;">${defect.quantity}</td>
                </tr>
                <tr>
                  <td style="color: #94a3b8; padding: 10px 0; font-size: 14px;">Reported By:</td>
                  <td style="color: #f8fafc; padding: 10px 0; font-size: 14px; text-align: right;">${defect.reportedBy}</td>
                </tr>
              </table>
            </div>
            
            <!-- Action Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/defects" 
                 style="display: inline-block; background-color: ${severityColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
                View Defect Details
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">
              Auto Carpets Warehouse Management System
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email notification types
export type NotificationType = 'alert' | 'transaction' | 'defect' | 'low_stock';

// Send email function
export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> => {
  const resend = getResend();
  
  if (!resend) {
    console.log('Email not configured - skipping send');
    return { success: false, error: 'Email service not configured' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Warehouse System <onboarding@resend.dev>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
    
    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Email sent successfully:', data);
    return { success: true };
  } catch (err) {
    console.error('Email send exception:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
};

// Helper functions to send specific notification types
export const sendAlertNotification = async (
  to: string | string[],
  alert: AlertEmailData
): Promise<{ success: boolean; error?: string }> => {
  const subject = `[${alert.severity.toUpperCase()}] Quantity Mismatch - ${alert.materialCode}`;
  const html = generateAlertEmailHTML(alert);
  return sendEmail(to, subject, html);
};

export const sendTransactionNotification = async (
  to: string | string[],
  transaction: TransactionEmailData
): Promise<{ success: boolean; error?: string }> => {
  const typeLabel = transaction.transactionType === 'receiving' ? 'Receiving' : 'Issuance';
  const subject = `[${typeLabel}] ${transaction.reference} - ${transaction.materialCode}`;
  const html = generateTransactionEmailHTML(transaction);
  return sendEmail(to, subject, html);
};

export const sendDefectNotification = async (
  to: string | string[],
  defect: DefectEmailData
): Promise<{ success: boolean; error?: string }> => {
  const subject = `[DEFECT - ${defect.severity.toUpperCase()}] ${defect.materialCode} - ${defect.defectType}`;
  const html = generateDefectEmailHTML(defect);
  return sendEmail(to, subject, html);
};
