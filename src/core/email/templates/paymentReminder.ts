export function paymentReminderEmaiTemplate(params: {
  studentName: string;
  className: string;
  sessionDate: string;
  sessionMonth: string;
  studentEmail: string;
  classFee: number | null;
  paymentUrl: string;
}) {
  const {
    studentName,
    className,
    sessionDate,
    sessionMonth,
    studentEmail,
    classFee,
    paymentUrl
  } = params;
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-radius: 5px;
        }
        .content {
          padding: 20px 0;
        }
        .details {
          background-color: #f8f9fa;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .bank-details {
          background-color: #f8f9fa;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        }
        .footer {
          font-size: 0.9em;
          color: #666;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Payment Reminder for ${sessionMonth}</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>This is a friendly reminder that your monthly payment for <strong>${className}</strong> is due in 3 days.</p>

          <div class="details">
            <h3>Payment Details</h3>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Month:</strong> ${sessionMonth}</p>
            <p><strong>Amount:</strong> Rs. ${classFee}</p>
            <p><strong>Due Date:</strong> Before the first Day of class</p>
            <p><strong>Next Class Date:</strong> ${sessionDate}</p>
          </div>

          <h3>Submit Your Payment</h3>
          <p>Click the button below to access your payment page where you can:</p>
          <ul>
            <li>View payment details</li>
            <li>Upload your bank transfer receipt</li>
            <li>Check payment history</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${paymentUrl}" class="button">Make Payment</a>
          </p>
          <p>If the button doesn't work, copy this link: <a href="${paymentUrl}">${paymentUrl}</a></p>
          <p>You'll need to sign in with your Comma Education account if you haven't already.</p>

          <div class="bank-details">
            <h3>Bank Transfer Details</h3>
            <p><strong>Bank:</strong> Commercial Bank</p>
            <p><strong>Account Name:</strong> Comma Education</p>
            <p><strong>Account Number:</strong> 1234567890</p>
            <p><strong>Branch:</strong> Colombo</p>
            <p>Please include your <strong>Name</strong> in the transfer reference.</p>
          </div>

          <h3>Need Help?</h3>
          <p>If you have any questions about your payment:</p>
          <ul>
            <li>WhatsApp us at +94 XX XXX XXXX</li>
            <li>Email us at <a href="mailto:payments@commaeducation.com">payments@commaeducation.com</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>This email was sent to ${studentEmail} because you are registered for classes at Comma Education.</p>
          <p><a href="https://www.commaeducation.com">www.commaeducation.com</a></p>
        </div>
      </div>
    </body>
  </html>
`;

  const text = `
Payment Reminder for ${sessionMonth}

Dear ${studentName},

This is a friendly reminder that your monthly payment for ${className} is due in 3 days.

Payment Details
---------------
Class: ${className}
Month: ${sessionMonth}
Amount: Rs. ${classFee}
Due Date: Before the first day of class
Next Class Date: ${sessionDate}

Submit Your Payment
------------------
Click here to access your payment page where you can:
- View payment details
- Upload your bank transfer receipt
- Check payment history

Payment Link: ${paymentUrl}

If the link doesn't work, copy and paste it into your browser: ${paymentUrl}

You'll need to sign in with your Comma Education account if you haven't already.

Bank Transfer Details
--------------------
Bank: Commercial Bank
Account Name: Comma Education
Account Number: 1234567890
Branch: Colombo

Please include your Name in the transfer reference.

Need Help?
---------
If you have any questions about your payment:
- WhatsApp us at +94 XX XXX XXXX
- Email us at payments@commaeducation.com

---
This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
www.commaeducation.com
`;

  return { html, text };
}
