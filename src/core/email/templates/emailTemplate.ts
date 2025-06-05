// lib/email/templates/student-credentials.ts
export function getStudentInvitationToClass(params: {
  studentName: string;
  email: string;
  className: string;
  loginUrl: string;
}) {
  const { studentName, email, className, loginUrl } = params;

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
              .credentials {
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
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Welcome to Your Class!</h2>
              </div>
              <div class="content">
                <p>Hello ${studentName},</p>
                <p>You have been successfully enrolled in <strong>${className}</strong>. Here are your login credentials:</p>
                
                <div class="credentials">
                  <p><strong>Email:</strong> ${email}</p>
                </div>
    
                <p>Please login using this eamil and password provided by you when registering to the class</p>
                
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" style="background-color: #E84437; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    Login to Your Account
                  </a>
                </p>
    
                <p>If you have any questions or need assistance, please don't hesitate to contact your tutor.</p>
                
                <p>Best regards,<br>Comma Education Team</p>
              </div>
            </div>
          </body>
        </html>
      `;

  const text = `
    Welcome to Your Class!
    
    Hello ${studentName},
    
    You have been successfully enrolled in ${className}. Here are your login credentials:
    
    Email: ${email}
    
    Please login using this email and password provided by you.
    
    You can login at: ${loginUrl}
    
    If you have any questions or need assistance, please don't hesitate to contact your tutor.
    
    Best regards,
    Your Education Team
      `;

  return { html, text };
}

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
    paymentUrl,
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
            <li>WhatsApp us at +94716751777</li>
            <li>Email us at <a href="mailto:payments@commaeducation.com">payments@commaeducation.com</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>This email was sent to ${studentEmail} because you are registered for classes at Comma Education.</p>
          <p><a href="https://www.commaeducation.lk">www.commaeducation.lk</a></p>
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
        - WhatsApp us at +94716751777
        - Email us at payments@commaeducation.com

        ---
        This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
        www.commaeducation.lk
`;

  return { html, text };
}

// lib/email/templates/student-credentials.ts
export function getStudentCredentialsEmailTemplate(params: {
  studentName: string;
  email: string;
  className: string;
  loginUrl: string;
}) {
  const { studentName, email, className, loginUrl } = params;

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
            .credentials {
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
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>Welcome to Your Class!</h2>
            </div>
            <div class="content">
              <p>Hello ${studentName},</p>
              <p>You have been successfully enrolled in <strong>${className}</strong>. Here are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
              </div>
  
              <p>Please login using this eamil and password provided by you when registering to the class</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background-color: #E84437; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Login to Your Account
                </a>
              </p>
  
              <p>If you have any questions or need assistance, please don't hesitate to contact your tutor.</p>
              
              <p>Best regards,<br>Comma Education Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

  const text = `
        Welcome to Your Class!
        
        Hello ${studentName},
        
        You have been successfully enrolled in ${className}. Here are your login credentials:
        
        Email: ${email}
        
        Please login using this email and password provided by you.
        
        You can login at: ${loginUrl}
        
        If you have any questions or need assistance, please don't hesitate to contact your tutor.
        
        Best regards,
        Your Education Team
    `;

  return { html, text };
}

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
          <p>Your <strong>${className}</strong> class recording from today is now available to watch.</p>

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
            <li>WhatsApp us at +94716751777</li>
            <li>Email us at <a href="mailto:support@commaeducation.com">support@commaeducation.com</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>This email was sent to ${studentEmail} because you are registered for classes at Comma Education.</p>
          <p><a href="https://www.commaeducation.lk">www.commaeducation.lk</a></p>
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
        - WhatsApp us at +94716751777
        - Email us at support@commaeducation.com

        ---
        This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
        www.commaeducation.lk
        `;

  return { html, text };
}

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
          <p>This is a friendly reminder that your <strong>${className}</strong> class is scheduled for tomorrow.</p>

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
            <li>WhatsApp us at +94716751777</li>
            <li>Email us at <a href="mailto:support@commaeducation.com">support@commaeducation.com</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>This email was sent to ${studentEmail} because you are registered for classes at Comma Education.</p>
          <p><a href="https://www.commaeducation.lk">www.commaeducation.lk</a></p>
        </div>
      </div>
    </body>
  </html>
`;
  const text = `
        Your Class Is Tomorrow!

        Dear ${studentName},

        This is a friendly reminder that your ${className} class is scheduled for tomorrow.

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
        - WhatsApp us at +94716751777
        - Email us at support@commaeducation.com

        ---
        This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
        www.commaeducation.lk
`;
  return { html, text };
}

export function getStudentNotifyBefore1HrEmailTemplate(params: {
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
          <h2>Your Class Is Today!</h2>
        </div>
        <div class="content">
          <p>Dear ${studentName},</p>
          <p>This is a friendly reminder that your <strong>${className}</strong> class is scheduled for tomorrow.</p>

          <div class="details">
            <h3>Class Details</h3>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Date:</strong> Today</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            ${topic ? `<p><strong>Topic:</strong> ${topic}</p>` : ''}

          </div>

          <h3>Your Class Access Link</h3>
          <p>Click the button below to access everything for this class:</p>
          <ul>
            <li>Join link for today's class</li>
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
            <li>WhatsApp us at +94716751777</li>
            <li>Email us at <a href="mailto:support@commaeducation.com">support@commaeducation.com</a></li>
          </ul>
        </div>
        <div class="footer">
          <p>This email was sent to ${studentEmail} because you are registered for classes at Comma Education.</p>
          <p><a href="https://www.commaeducation.lk">www.commaeducation.lk</a></p>
        </div>
      </div>
    </body>
  </html>
`;
  const text = `
        Your Class Is Tomorrow!

        Dear ${studentName},

        This is a friendly reminder that your ${className} class is scheduled for tomorrow.

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
        - WhatsApp us at +94716751777
        - Email us at support@commaeducation.com

        ---
        This email was sent to ${studentEmail} because you are registered for classes at Comma Education.
        www.commaeducation.lk
`;
  return { html, text };
}

export function getUserCredentialsEmailTemplate(params: {
  userName: string;
  email: string;
  password: string;
  userRole: string;
  loginUrl: string;
}) {
  const { userName, email, password, userRole, loginUrl } = params;
  const roleCapitalized = userRole.charAt(0).toUpperCase() + userRole.slice(1);

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
          .credentials {
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to Your ${roleCapitalized} Account!</h2>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Your ${roleCapitalized} account has been successfully created. Here are your login credentials:</p>
            
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${password}</p>
            </div>

            <p>For security reasons, please change your password after your first login.</p>
            
            <p style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="background-color: #E84437; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
            </p>

            <p>If you have any questions or need assistance, please don't hesitate to contact the admin team.</p>
            
            <p>Best regards,<br>Your Institute Admin Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
        Welcome to Your ${roleCapitalized} Account!

        Hello ${userName},

        Your ${roleCapitalized} account has been successfully created. Here are your login credentials:

        Email: ${email}
        Temporary Password: ${password}

        For security reasons, please change your password after your first login.

        You can login at: ${loginUrl}

        If you have any questions or need assistance, please don't hesitate to contact the admin team.

        Best regards,
        Your Institute Admin Team
  `;

  return { html, text };
}
