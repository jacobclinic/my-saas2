import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION,
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY!,
  },
});

// Interface for email parameters
interface EmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Function to send email
export const sendEmail = async ({ to, subject, html, text }: EmailParams): Promise<void> => {
  const params = {
    Source: process.env.SES_FROM_EMAIL!, // Verified sender email
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to], // Recipient(s)
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
        Text: text
          ? {
              Data: text,
              Charset: "UTF-8",
            }
          : undefined,
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    await sesClient.send(command);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};