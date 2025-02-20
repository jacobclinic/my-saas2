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
              <a href="${loginUrl}" class="button">Login to Your Account</a>
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