import nodemailer from 'nodemailer';

let transporter = null;

export function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const transport = getTransporter();
  
  if (!transport) {
    console.warn('⚠️ SMTP variables missing. Email service disabled. Skipping email send.');
    return;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  
  return transport.sendMail({
    from,
    to,
    subject,
    html
  });
}
