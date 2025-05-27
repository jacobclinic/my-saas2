export function getStudentNotifyBeforeEmailTemplate(params: {
  studentName: string;
  className: string;
  sessionDate: string;
  sessionTime: string;
  topic: string | null;
  classId: string;
  studentEmail: string;
}) {
  const {
    studentName,
    className,
    sessionDate,
    sessionTime,
    topic,
    classId,
    studentEmail,
  } = params;

  // No need to re-parse the date since we're already passing formatted strings
  const date = sessionDate;
  const timeStr = sessionTime;

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
          <h2>Your Class Is Tomorrow!</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>This is a friendly reminder that your <strong>A/L Accounting</strong> class is scheduled for tomorrow.</p>

          <div class="details">
            <h3>Class Details</h3>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}

          </div>

          <h3>Your Class Access Link</h3>
          <p>Click the button below to access everything for this class:</p>
          <ul>
            <li>Join link for tomorrow's class</li>
            <li>Class materials and resources</li>
            <li>Recording (available after class)</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" style="background-color: #E84437; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Access Class</a>
          </p>
          <p>If the button doesn't work, copy this link: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}">${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}</a></p>
          <p>You'll need to sign in with your Comma Education account if you haven't already.</p>

          <h3>Need Help?</h3>
          <p>If you have any issues accessing your class:</p>
          <ul>
            <li>WhatsApp us at +94 XX XXX XXXX</li>
            <li>Email us at <a href="mailto:support@commaeducation.com">support@commaeducation.com</a></li>
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
Your Class Is Tomorrow!

Dear ${studentName},

This is a friendly reminder that your A/L Accounting class is scheduled for tomorrow.

Class Details
------------
Class: ${className}
Date: ${date}
Time: ${sessionTime}
${topic ? `Topic: ${topic}` : ''}

Your Class Access Link
---------------------
Click here to access everything for this class:
- Join link for tomorrow's class
- Class materials and resources
- Recording (available after class)

Access Link: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

You'll need to sign in with your Comma Education account if you haven't already.

Need Help?
---------
If you have any issues accessing your class:
- WhatsApp us at +94 XX XXX XXXX
- Email us at support@commaeducation.com

---
This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
www.commaeducation.com
`;
  return { html, text };
}
