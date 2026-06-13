import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Send an invitation email to a supplier
 * @param {Object} supplier - Supplier mongoose document
 * @param {Object} shopOwner - User mongoose document representing the shop owner
 */
export async function sendSupplierInvite(supplier, shopOwner) {
  // 1. Generate invite token
  const token = crypto.randomBytes(32).toString('hex');
  
  // 2. Update supplier document
  supplier.inviteToken = token;
  supplier.inviteTokenExpiry = Date.now() + 48 * 60 * 60 * 1000; // 48 hours
  supplier.inviteStatus = 'invited';
  supplier.portalEnabled = true;
  await supplier.save();

  // 3. Configure Nodemailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 4. Send Email
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const inviteLink = `${clientUrl}/supplier/accept-invite?token=${token}`;
  
  const shopName = shopOwner.shopName || shopOwner.name;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Digibill" <noreply@digibill.app>',
    to: supplier.portalEmail,
    subject: `${shopName} has invited you to view your invoices on Digibill`,
    text: `Hello ${supplier.name},\n\nYou've been invited to view and manage invoices from ${shopName}.\n\nPlease accept your invitation by visiting the following link:\n${inviteLink}\n\nThis link expires in 48 hours.\n\nThank you,\nThe Digibill Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Welcome to Digibill</h2>
        <p style="color: #555; font-size: 16px;">Hello ${supplier.name},</p>
        <p style="color: #555; font-size: 16px;">You've been invited to view and manage invoices from <strong>${shopName}</strong> securely on the Digibill portal.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Accept Invitation</a>
        </div>
        
        <p style="color: #777; font-size: 14px;">This link expires in 48 hours.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">If you did not expect this email, you can safely ignore it.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

export default { sendSupplierInvite };
