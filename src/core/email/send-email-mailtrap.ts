import nodemailer from 'nodemailer';

interface EmailData {
  to: string;
  text: string;
  html: string;
  subject: string;
  from:string;
}

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
      secure: process.env.MAILTRAP_PORT === '465',
    });
  }

  // Singleton instance getter
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }
  async sendEmail({
    from,
    to,
    subject,
    text,
    html,
  }: EmailData): Promise<void> {
    try {
      const mailData = {
        from,
        to,
        subject,
        text,
        html,
      };

      await this.transporter.sendMail(mailData);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  // Optional: Close transporter when done (e.g., on app shutdown)
  async close(): Promise<void> {
    await this.transporter.close();
  }
}
