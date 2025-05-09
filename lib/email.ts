// Simple email service implementation that doesn't rely on Resend
// This avoids the React 19 compatibility issues with @react-email/render

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@pay.qudmeet.click';

// Simple email service that just logs emails for now
// In production, you would integrate with a service like SendGrid, Mailgun, etc.
const emailService = {
  send: async (options: any) => {
    console.log('EMAIL SENT:', {
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text?.substring(0, 100) + '...',
    });
    return {
      id: 'email-' + Date.now(),
      success: true
    };
  }
};

export enum EmailType {
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_SENT = 'payment_sent',
  TRANSACTION_COMPLETED = 'transaction_completed',
  RECEIPT_READY = 'receipt_ready',
  WELCOME = 'welcome',
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Email templates
const templates = {
  [EmailType.PAYMENT_RECEIVED]: (data: any) => ({
    subject: 'Payment Received - Pay.Qudmeet',
    text: `Hello ${data.name},\n\nWe have received your payment of ${data.amountSent} ${data.fromCurrency}. We are processing your transaction now.\n\nTransaction ID: ${data.transactionId}\n\nThank you,\nPay.Qudmeet Team`,
    html: `<h1>Payment Received</h1><p>Hello ${data.name},</p><p>We have received your payment of ${data.amountSent} ${data.fromCurrency}. We are processing your transaction now.</p><p>Transaction ID: <strong>${data.transactionId}</strong></p><p>Thank you,<br>Pay.Qudmeet Team</p>`,
  }),
  [EmailType.PAYMENT_SENT]: (data: any) => ({
    subject: 'Payment Sent - Pay.Qudmeet',
    text: `Hello ${data.name},\n\nYour payment of ${data.amountReceived} ${data.toCurrency} has been sent. Please check your account.\n\nTransaction ID: ${data.transactionId}\n\nThank you,\nPay.Qudmeet Team`,
    html: `<h1>Payment Sent</h1><p>Hello ${data.name},</p><p>Your payment of ${data.amountReceived} ${data.toCurrency} has been sent. Please check your account.</p><p>Transaction ID: <strong>${data.transactionId}</strong></p><p>Thank you,<br>Pay.Qudmeet Team</p>`,
  }),
  [EmailType.TRANSACTION_COMPLETED]: (data: any) => ({
    subject: 'Transaction Completed - Pay.Qudmeet',
    text: `Hello ${data.name},\n\nYour transaction has been completed successfully. You sent ${data.amountSent} ${data.fromCurrency} and received ${data.amountReceived} ${data.toCurrency}.\n\nTransaction ID: ${data.transactionId}\n\nThank you for using our service.\n\nPay.Qudmeet Team`,
    html: `<h1>Transaction Completed</h1><p>Hello ${data.name},</p><p>Your transaction has been completed successfully. You sent ${data.amountSent} ${data.fromCurrency} and received ${data.amountReceived} ${data.toCurrency}.</p><p>Transaction ID: <strong>${data.transactionId}</strong></p><p>Thank you for using our service.</p><p>Pay.Qudmeet Team</p>`,
  }),
  [EmailType.RECEIPT_READY]: (data: any) => ({
    subject: 'Your Receipt is Ready - Pay.Qudmeet',
    text: `Hello ${data.name},\n\nYour receipt for transaction ID ${data.transactionId} is ready. You can view and download it from your account.\n\nThank you,\nPay.Qudmeet Team`,
    html: `<h1>Receipt Ready</h1><p>Hello ${data.name},</p><p>Your receipt for transaction ID <strong>${data.transactionId}</strong> is ready. You can view and download it from your account.</p><p>Thank you,<br>Pay.Qudmeet Team</p>`,
  }),
  [EmailType.WELCOME]: (data: any) => ({
    subject: 'Welcome to Pay.Qudmeet!',
    text: `Hello ${data.name},\n\nWelcome to Pay.Qudmeet! We're excited to have you on board.\n\nWith our platform, you can securely exchange currencies between Nigeria and India without any hassle.\n\nIf you have any questions, feel free to contact us.\n\nBest regards,\nPay.Qudmeet Team`,
    html: `<h1>Welcome to Pay.Qudmeet!</h1><p>Hello ${data.name},</p><p>Welcome to Pay.Qudmeet! We're excited to have you on board.</p><p>With our platform, you can securely exchange currencies between Nigeria and India without any hassle.</p><p>If you have any questions, feel free to contact us.</p><p>Best regards,<br>Pay.Qudmeet Team</p>`,
  }),
};

export async function sendEmail(type: EmailType, data: any, to: string): Promise<boolean> {
  try {
    const template = templates[type](data);

    const emailData: EmailData = {
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };

    // Send email using our simple email service
    try {
      const result = await emailService.send({
        from: FROM_EMAIL,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      });

      if (!result.success) {
        console.error('Failed to send email');
        return false;
      }
    } catch (err) {
      console.error('Error sending email:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}