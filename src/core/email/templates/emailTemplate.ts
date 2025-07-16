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

//updated
export function paymentReminderEmaiTemplate(params: {
  studentName: string;
  className: string;
  sessionDate: string;
  sessionMonth: string;
  studentEmail: string;
  classFee: number | null;
  paymentUrl: string;
  classId: string;
}) {
  const {
    studentName,
    className,
    sessionDate,
    sessionMonth,
    studentEmail,
    classFee,
    paymentUrl,
    classId,
  } = params;

  const html = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment reminder - Comma Education</title>
        <style>
          /* Base styles */
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            line-height: 1.5;
            color: #333333;
            background-color: #f8f8f8;
          }
          
          /* Container styles */
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          /* Header styles */
          .header {
            background: linear-gradient(135deg, #1A365D 0%, #264B77 100%);
            padding: 20px;
            text-align: center;
          }
          
          .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          
          /* Content styles */
          .content {
            padding: 30px;
          }
          
          h1 {
            color: #1A365D;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 16px;
          }
          
          p {
            margin-bottom: 16px;
            color: #4a4a4a;
          }
          
          /* Button styles */
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          
          .button {
            display: inline-block;
            background-color: #E05D14;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            text-align: center;
            transition: background-color 0.3s ease;
          }
          
          .button:hover {
            background-color: #C24700;
          }
          
          /* Highlight box */
          .highlight-box {
            background-color: #f1f6fc;
            border-left: 4px solid #1A365D;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          /* Footer styles */
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            border-top: 3px solid #E05D14;
          }
          
          .social-links {
            margin-top: 15px;
          }
          
          .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #1A365D;
            text-decoration: none;
          }
          
          /* Responsive styles */
          @media only screen and (max-width: 480px) {
            .content {
              padding: 20px;
            }
            
            .button {
              display: block;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="background-color: #f8f8f8; padding: 20px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
                <!-- Header -->
                <tr>
                  <td align="center" class="header">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h1 class="logo">Comma Education</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="content">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <h1>Payment Reminder for ${sessionMonth} ${className} class</h1>
                          <p>Hi ${studentName},</p>
                          <p>This is a friendly reminder that the payment for your ${className} class is due in 2 days, on ${sessionDate}.</p>
                          
                          <div class="highlight-box">
                            <p style="margin-top: 0;">To ensure your continued access to the class and materials, please complete your payment and submit your receipt through the link below:</p>
                          </div>
                          
                          <div class="button-container">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Access Class</a>
                          </div>
                          
                          <p>If you've already made the payment, please disregard this email or ensure you have uploaded your receipt.</p>
                          <p>For any questions or assistance regarding your payment, please don't hesitate to contact our support team.</p>
                          <p>Best regards,<br>The Team at Comma Education</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td class="footer">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <p>&copy; ${new Date().getFullYear()} Comma Education. All rights reserved.</p>
                          <p>Your trusted partner in online education.</p>
                          <div class="social-links">
                            <a href="mailto:support@commaeducation.com" class="social-link">Support</a> |
                            <a href="https://app.commaeducation.lk/" class="social-link">Website</a> |
                            <a href="#" class="social-link">Unsubscribe</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
        Hi ${studentName},

        This is a friendly reminder that the payment for your ${className} class is due in 2 days, on ${sessionDate}.


        To ensure your continued access to the class and materials, please complete your payment and submit your receipt through the link below:
        
        Payment Url: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

        You'll need to sign in with your Comma Education account if you haven't already.

        If you've already made the payment, please disregard this email or ensure you have uploaded your receipt.

        For any questions or assistance regarding your payment, please don't hesitate to contact our support team.

        Thank you,
        The Comma Education Team

`;

  return { html, text };
}

// lib/email/templates/student-credentials.ts

//updated
export function getStudentRegistrationEmailTemplate(params: {
  studentName: string;
  email: string;
  className: string;
  classId: string;
  loginUrl: string;
}) {
  const { studentName, email, className, loginUrl, classId } = params;

  const html = `
    <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment reminder - Comma Education</title>
        <style>
          /* Base styles */
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            line-height: 1.5;
            color: #333333;
            background-color: #f8f8f8;
          }
          
          /* Container styles */
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          
          /* Header styles */
          .header {
            background: linear-gradient(135deg, #1A365D 0%, #264B77 100%);
            padding: 20px;
            text-align: center;
          }
          
          .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            margin: 0;
          }
          
          /* Content styles */
          .content {
            padding: 30px;
          }
          
          h1 {
            color: #1A365D;
            font-size: 20px;
            margin-top: 0;
            margin-bottom: 16px;
          }
          
          p {
            margin-bottom: 16px;
            color: #4a4a4a;
          }
          
          /* Button styles */
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          
          .button {
            display: inline-block;
            background-color: #E05D14;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 4px;
            font-weight: bold;
            text-align: center;
            transition: background-color 0.3s ease;
          }
          
          .button:hover {
            background-color: #C24700;
          }
          
          /* Highlight box */
          .highlight-box {
            background-color: #f1f6fc;
            border-left: 4px solid #1A365D;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          /* Footer styles */
          .footer {
            background-color: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666666;
            font-size: 14px;
            border-top: 3px solid #E05D14;
          }
          
          .social-links {
            margin-top: 15px;
          }
          
          .social-link {
            display: inline-block;
            margin: 0 8px;
            color: #1A365D;
            text-decoration: none;
          }
          
          /* Responsive styles */
          @media only screen and (max-width: 480px) {
            .content {
              padding: 20px;
            }
            
            .button {
              display: block;
              text-align: center;
            }
          }
        </style>
      </head>
      <body>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="background-color: #f8f8f8; padding: 20px 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
                <!-- Header -->
                <tr>
                  <td align="center" class="header">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <h1 class="logo">Comma Education</h1>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="content">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td>
                          <h1>Welcome to ${className}</h1>
                          <p>Hi ${studentName},</p>
                          <p>Welcome aboard! You're now registered for ${className} with Comma Education. We're excited to have you.</p>
                          
                          <div class="highlight-box">
                            <p style="margin-top: 0;">You can access your student portal using the link below. This is where you'll find class materials, schedules, and other important information.</p>
                          </div>
                          
                          <div class="button-container">
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Access Class</a>
                          </div>
                          
                          <p>Please log in using the email and password you provided during registration.</p>
                          <p>If you have any questions or need help getting started, our support team is ready to assist.</p>
                          <p>We look forward to seeing you in class!</p>
                          <p>Best regards,<br>The Team at Comma Education</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td class="footer">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <p>&copy; ${new Date().getFullYear()} Comma Education. All rights reserved.</p>
                          <p>Your trusted partner in online education.</p>
                          <div class="social-links">
                            <a href="mailto:support@commaeducation.com" class="social-link">Support</a> |
                            <a href="https://app.commaeducation.lk/" class="social-link">Website</a> |
                            <a href="#" class="social-link">Unsubscribe</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const text = `
        Welcome to Your Class!
        
        Hi ${studentName},
        
        Welcome aboard! You're now registered for [Class Name] with Comma Education. We're excited to have you.
        
        You can access your student portal using the link below. This is where you'll find class materials, schedules, and other important information.
        
        Student Portal Link: ${loginUrl}
        
        Please log in using the email and password you provided during registration.

        If you have any questions or need help getting started, our support team is ready to assist.
        
        We look forward to seeing you in class!
        Best regards,
        The Comma Education Team
    `;

  return { html, text };
}

//updated
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recording Available - Comma Education</title>
      <style>
        /* Base styles */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          line-height: 1.5;
          color: #333333;
          background-color: #f8f8f8;
        }
        
        /* Container styles */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        /* Header styles */
        .header {
          background: linear-gradient(135deg, #1A365D 0%, #264B77 100%);
          padding: 20px;
          text-align: center;
        }
        
        .logo {
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        
        /* Content styles */
        .content {
          padding: 30px;
        }
        
        h1 {
          color: #1A365D;
          font-size: 20px;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        p {
          margin-bottom: 16px;
          color: #4a4a4a;
        }
        
        /* Button styles */
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        
        .button {
          display: inline-block;
          background-color: #E05D14;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
          transition: background-color 0.3s ease;
        }
        
        .button:hover {
          background-color: #C24700;
        }
        
        /* Highlight box */
        .highlight-box {
          background-color: #f1f6fc;
          border-left: 4px solid #1A365D;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        /* Footer styles */
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
          border-top: 3px solid #E05D14;
        }
        
        .social-links {
          margin-top: 15px;
        }
        
        .social-link {
          display: inline-block;
          margin: 0 8px;
          color: #1A365D;
          text-decoration: none;
        }
        
        /* Responsive styles */
        @media only screen and (max-width: 480px) {
          .content {
            padding: 20px;
          }
          
          .button {
            display: block;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="background-color: #f8f8f8; padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
              <!-- Header -->
              <tr>
                <td align="center" class="header">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <h1 class="logo">Comma Education</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h1>Recording for ${className} is Now Available! </h1>
                        <p>Hi ${studentName},</p>
                        <p>Hope you found today's ${className} session informative! </p>
                        
                        <div class="highlight-box">
                          <p style="margin-top: 0;">The recording of the class is now available. You can access it using the link below to review the material or catch up if you missed anything</p>
                        </div>
                        
                        <div class="button-container">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Access Class</a>
                        </div>
                        
                        <p>You'll need to sign in with your Comma Education account if you haven't already.</p>
                        <p>If you have any questions or need assistance, our support team is here to help.</p>
                        <p>See you in next class!</p>
                        <p>Best regards,<br>The Team at Comma Education</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td class="footer">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <p>&copy; ${new Date().getFullYear()} Comma Education. All rights reserved.</p>
                        <p>Your trusted partner in online education.</p>
                        <div class="social-links">
                          <a href="mailto:support@commaeducation.com" class="social-link">Support</a> |
                          <a href="https://app.commaeducation.lk/" class="social-link">Website</a> |
                          <a href="#" class="social-link">Unsubscribe</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  const text = `
        Hi ${studentName},

        Hope you found today's ${className} session informative!

        The recording of the class is now available. You can access it using the link below to review the material or catch up if you missed anything:

        Access Link: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

        This link will also give you access to other class materials.

        If you have any questions or need further assistance, please feel free to reach out.

        Happy learning!
        Best regards,
        The Comma Education Team
        `;

  return { html, text };
}

//updated
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Class Reminder - Comma Education</title>
      <style>
        /* Base styles */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          line-height: 1.5;
          color: #333333;
          background-color: #f8f8f8;
        }
        
        /* Container styles */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        /* Header styles */
        .header {
          background: linear-gradient(135deg, #1A365D 0%, #264B77 100%);
          padding: 20px;
          text-align: center;
        }
        
        .logo {
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        
        /* Content styles */
        .content {
          padding: 30px;
        }
        
        h1 {
          color: #1A365D;
          font-size: 20px;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        p {
          margin-bottom: 16px;
          color: #4a4a4a;
        }
        
        /* Button styles */
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        
        .button {
          display: inline-block;
          background-color: #E05D14;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
          transition: background-color 0.3s ease;
        }
        
        .button:hover {
          background-color: #C24700;
        }
        
        /* Highlight box */
        .highlight-box {
          background-color: #f1f6fc;
          border-left: 4px solid #1A365D;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        /* Footer styles */
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
          border-top: 3px solid #E05D14;
        }
        
        .social-links {
          margin-top: 15px;
        }
        
        .social-link {
          display: inline-block;
          margin: 0 8px;
          color: #1A365D;
          text-decoration: none;
        }
        
        /* Responsive styles */
        @media only screen and (max-width: 480px) {
          .content {
            padding: 20px;
          }
          
          .button {
            display: block;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="background-color: #f8f8f8; padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
              <!-- Header -->
              <tr>
                <td align="center" class="header">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <h1 class="logo">Comma Education</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h1>Reminder: Your ${className} Class is Tomorrow!</h1>
                        <p>Hi ${studentName},</p>
                        <p>This is a friendly reminder that your class, <strong>${className}</strong>, is scheduled for tomorrow, <strong>${date}</strong>, at <strong>${sessionTime}</strong>.</p>
                        
                        <div class="highlight-box">
                          <p style="margin-top: 0;">You can join the class and access all your class materials using the single link below:</p>
                        </div>
                        
                        <div class="button-container">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Join Your Class</a>
                        </div>
                        
                        <p>We recommend joining a few minutes early to ensure everything is working smoothly.</p>
                        <p>If you have any questions or need assistance, our support team is here to help.</p>
                        <p>See you in class!</p>
                        <p>Best regards,<br>The Team at Comma Education</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td class="footer">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <p>&copy; ${new Date().getFullYear()} Comma Education. All rights reserved.</p>
                        <p>Your trusted partner in online education.</p>
                        <div class="social-links">
                          <a href="mailto:support@commaeducation.com" class="social-link">Support</a> |
                          <a href="https://app.commaeducation.lk/" class="social-link">Website</a> |
                          <a href="#" class="social-link">Unsubscribe</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  const text = `
      Your Class Is Tomorrow!

      Hi ${studentName},

      This is a friendly reminder that your ${className} class is scheduled for tomorrow, ${date} at ${sessionTime}.

      You can join the class and access all your class materials using the single link below:

      Access Link: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

      We recommend joining a few minutes early to ensure everything is working smoothly.

      You'll need to sign in with your Comma Education account if you haven't already.

      If you have any questions or need assistance, our support team is here to help.
      See you in class!
      Best regards,
      The Team at Comma Education

`;
  return { html, text };
}

//updated
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Class Reminder - Comma Education</title>
      <style>
        /* Base styles */
        body {
          margin: 0;
          padding: 0;
          font-family: 'Arial', sans-serif;
          line-height: 1.5;
          color: #333333;
          background-color: #f8f8f8;
        }
        
        /* Container styles */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        
        /* Header styles */
        .header {
          background: linear-gradient(135deg, #1A365D 0%, #264B77 100%);
          padding: 20px;
          text-align: center;
        }
        
        .logo {
          color: #ffffff;
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        
        /* Content styles */
        .content {
          padding: 30px;
        }
        
        h1 {
          color: #1A365D;
          font-size: 20px;
          margin-top: 0;
          margin-bottom: 16px;
        }
        
        p {
          margin-bottom: 16px;
          color: #4a4a4a;
        }
        
        /* Button styles */
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        
        .button {
          display: inline-block;
          background-color: #E05D14;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          text-align: center;
          transition: background-color 0.3s ease;
        }
        
        .button:hover {
          background-color: #C24700;
        }
        
        /* Highlight box */
        .highlight-box {
          background-color: #f1f6fc;
          border-left: 4px solid #1A365D;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        /* Footer styles */
        .footer {
          background-color: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #666666;
          font-size: 14px;
          border-top: 3px solid #E05D14;
        }
        
        .social-links {
          margin-top: 15px;
        }
        
        .social-link {
          display: inline-block;
          margin: 0 8px;
          color: #1A365D;
          text-decoration: none;
        }
        
        /* Responsive styles */
        @media only screen and (max-width: 480px) {
          .content {
            padding: 20px;
          }
          
          .button {
            display: block;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="background-color: #f8f8f8; padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" class="container">
              <!-- Header -->
              <tr>
                <td align="center" class="header">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <h1 class="logo">Comma Education</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td class="content">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h1>Starting Soon: Your ${className} Class!</h1>
                        <p>Hi ${studentName},</p>
                        <p>Just a quick heads-up – your ${className} class is starting within 1 hour!</p>
                        
                        <div class="highlight-box">
                          <p style="margin-top: 0;">Click the following button to join: </p>
                        </div>
                        
                        <div class="button-container">
                          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}" class="button">Join Your Class</a>
                        </div>
                        
                        <p>We recommend joining a few minutes early to ensure everything is working smoothly.</p>
                        <p>If you have any questions or need assistance, our support team is here to help.</p>
                        <p>See you shortly in class!</p>
                        <p>Best regards,<br>The Team at Comma Education</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td class="footer">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="center">
                        <p>&copy; ${new Date().getFullYear()} Comma Education. All rights reserved.</p>
                        <p>Your trusted partner in online education.</p>
                        <div class="social-links">
                          <a href="mailto:support@commaeducation.com" class="social-link">Support</a> |
                          <a href="https://app.commaeducation.lk/" class="social-link">Website</a> |
                          <a href="#" class="social-link">Unsubscribe</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  const text = `
        Hi ${studentName},

        Just a quick heads-up – your [Class Name] class is starting within 1 hour!

        Click here to join: ${process.env.NEXT_PUBLIC_SITE_URL}/class/${classId}

        See you shortly!
        Best regards,
        The Comma Education Team

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

export function getNotifyClassUpdateTemplate(params:{
  className: string;
  studentName: string;
  firstClassDate: string;
  updatedClassDay: string;
  updatedClassTime: string;
}){

  const { className, studentName, firstClassDate, updatedClassDay, updatedClassTime } = params;

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
            <h2>Important Schedule Update for Your ${className} class</h2>
          </div>
          <div class="content">
            <p>Hello ${studentName},</p>
            <p>This email is to inform you of a schedule change for your ${className} class.</p>

            <p>Effective from ${firstClassDate}, all future sessions for yhis class will be held on:</p>
            <p><strong>${updatedClassDay} at ${updatedClassTime}</strong></p>
            
            <p>We apologize for any inconvenience this adjustment may cause.</p>

            <p>Your existing links to join the class and access the student portal will continue to work without any changes.</p>

            <p>If you have any questions, please contact our support team for assistance.</p>
            
            <p>Thank you for your understanding.</p>
            
            <p>Best regards,<br>The Comma Education Team</p>
          </div>
        </div>
      </body>
    </html>
  `;

    const text = `
        Dear ${studentName},

        This email is to inform you of a schedule change for your ${className} class.

        Effective from ${firstClassDate}, all future sessions for this class will be held on:
        ${updatedClassDay} at ${updatedClassTime}
        
        We apologize for any inconvenience this adjustment may cause.
        
        Your existing links to join the class and access the student portal will continue to work without any changes.
        
        If you have any questions, please contact our support team for assistance.
        
        Thank you for your understanding.

        Best regards,
        The Comma Education Team
        `;

  return { html, text };
}