// lib/email/templates/student-credentials.ts
export function getStudentCredentialsEmailTemplate(params: {
    studentName: string;
    email: string;
    password: string;
    className: string;
    loginUrl: string;
  }) {
    const { studentName, email, password, className, loginUrl } = params;
  
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
                <p><strong>Password:</strong> ${password}</p>
              </div>
  
              <p>Please login using these credentials and change your password after your first login.</p>
              
              <p style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" class="button">Login to Your Account</a>
              </p>
  
              <p>If you have any questions or need assistance, please don't hesitate to contact your tutor.</p>
              
              <p>Best regards,<br>Your Education Team</p>
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
  Password: ${password}
  
  Please login using these credentials and change your password after your first login.
  
  You can login at: ${loginUrl}
  
  If you have any questions or need assistance, please don't hesitate to contact your tutor.
  
  Best regards,
  Your Education Team
    `;
  
    return { html, text };
  }