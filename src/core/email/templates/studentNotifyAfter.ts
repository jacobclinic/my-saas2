export function getStudentNotifyAfterEmailTemplate(params: {
  studentName: string;
  className: string;
  sessionDate: string;
  topic: string | null;
  classId: string;
  studentEmail: string;
}) {
  const { studentName, className, sessionDate, topic, classId, studentEmail } =
    params;

  const dateObj = new Date(sessionDate);
  const date = dateObj.toLocaleDateString('en-GB');

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
          <h2>Your Class Recording Is Ready!</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>Your <strong>A/L Accounting</strong> class recording from today is now available to watch.</p>

          <div class="details">
            <h3>Class Details</h3>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Date:</strong> ${date}</p>
            ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}
          </div>

          <h3>Access Your Class onslaughtContent</h3>
          <p>Click the button below to access everything for this class:</p>
          <ul>
            <li>Today's class recording</li>
            <li>Class materials and resources</li>
            <li>Past recordings</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Access Class</a>
          </p>
          <p>If the button doesn't work, copy this link: <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}">${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}</a></p>
          <p>You'll need to sign in with your Comma Education account if you haven't already.</p>

          <h3>Need Help?</h3>
          <p>If you have any issues accessing your recording:</p>
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
        Your Class Recording Is Ready!

        Dear ${studentName},

        Your A/L Accounting class recording from today is now available to watch.

        Class Details
        ------------
        Class: ${className}
        Date: ${date}
        ${topic ? `Topic: ${topic}` : ''}

        Access Your Class Content
        ------------------------
        Click here to access everything for this class:
        - Today's class recording
        - Class materials and resources
        - Past recordings

        Access Link: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

        If the link doesn't work, copy and paste it into your browser: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

        You'll need to sign in with your Comma Education account if you haven't already.

        Need Help?
        ---------
        If you have any issues accessing your recording:
        - WhatsApp us at +94 XX XXX XXXX
        - Email us at support@commaeducation.com

        ---
        This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
        www.commaeducation.com
        `;

  return { html, text };
}
