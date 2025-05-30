interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export default async function sendEmail(config: SendEmailParams) {
  try {
    const transporter = await getTransporter();
    
    const result = await transporter.sendMail(config);
    return result;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw error;
  }
}

function getTransporter() {
  if (isTest()) {
    return getMockMailTransporter();
  }

  return getSMTPTransporter();
}

async function getSMTPTransporter() {
  try {
    const nodemailer = await import('nodemailer');

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT);

    const secure = port === 465;

    if (!user || !pass || !host || !port) {
      throw new Error(
        `Missing email configuration. Please add the following environment variables:
        EMAIL_USER
        EMAIL_PASSWORD
        EMAIL_HOST
        EMAIL_PORT`
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    
    return transporter;
  } catch (error) {
    console.error('Error in getSMTPTransporter:', error);
    throw error;
  }
}

async function getEtherealMailTransporter() {
  try {
    const nodemailer = await import('nodemailer');
    const testAccount = await getEtherealTestAccount();
    
    const host = 'smtp.ethereal.email';
    const port = 587;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
        return transporter;
  } catch (error) {
    console.error('Error in getEtherealMailTransporter:', error);
    throw error;
  }
}

function getMockMailTransporter() {
  return {
    sendMail(params: SendEmailParams) {
      console.log(
        `Using mock email transporter with params`,
        JSON.stringify(params, null, 2)
      );
    },
  };
}

async function getEtherealTestAccount() {
  const user = process.env.ETHEREAL_EMAIL;
  const pass = process.env.ETHEREAL_PASSWORD;

  // if we have added an Ethereal account, we reuse these credentials to
  // send the email
  if (user && pass) {
    console.log(`Sending email with Ethereal test account...`);

    return {
      user,
      pass,
    };
  }

  // Otherwise, we create a new account and recommend to add the credentials
  // to the configuration file
  return createEtherealTestAccount();
}

async function createEtherealTestAccount() {
  const nodemailer = await import('nodemailer');
  const newAccount = await nodemailer.createTestAccount();

  console.warn(`
    Configuration property "emailEtherealTestAccount" was not found! 
    Consider adding a fixed Ethereal account so that you don't need to update the credentials each time you use it.
    To do so, please use the guide at https://makerkit.dev/docs/email
  `);

  console.log(
    `Created Ethereal test account: ${JSON.stringify(newAccount, null, 2)}`,
  );

  console.log(`Consider adding these credentials to your configuration file`);

  return newAccount;
}

function isTest() {
  return process.env.IS_CI === 'true';
}
