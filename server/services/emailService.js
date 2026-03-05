import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';

// dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: `"Serian Institute" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request - Serian Institute',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>You requested to reset your password for your Serian Institute account.</p>
        <p>Click the button below to reset your password. This link will expire in <strong>5 minutes</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p>If you didn't request this, please ignore this email.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated message from Serian Institute.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

export const sendPasswordResetConfirmation = async (email) => {
  const mailOptions = {
    from: `"Serian Institute" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Successful - Serian Institute',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Password Reset Successful</h2>
        <p>Your Serian Institute password has been successfully reset.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; color: #666;">
            <strong>Time:</strong> ${new Date().toLocaleString()}<br>
            <strong>Account:</strong> ${email}
          </p>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated security notification from Serian Institute.
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};