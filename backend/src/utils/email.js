const { transporter, emailSender } = require("../config/email");

async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Chihwa Rentals" <${emailSender}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

async function sendResetCodeEmail(email, fullName, resetCode) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Password Reset</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p>Hello ${fullName},</p>
        <p>We received a request to reset your password for your Chihwa Rentals account.</p>
        <p>Please use the verification code below to proceed:</p>
        <p style="font-size: 28px; letter-spacing: 6px; margin: 24px 0;">
          <strong>${resetCode}</strong>
        </p>
        <p>This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        <p>Kind regards,<br/>Chihwa Rentals Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return sendEmail(email, "Password Reset Verification Code", html);
}

async function sendWelcomeEmail(email, fullName, tempPassword, role) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Welcome to Chihwa Rentals</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p>Hello ${fullName},</p>
        <p>Your landlord has created an account for you on Chihwa Rentals as a <strong>${role}</strong>.</p>
        <p>Your temporary password is:</p>
        <p style="font-size: 20px; letter-spacing: 3px; margin: 18px 0;">
          <strong>${tempPassword}</strong>
        </p>
        <p>You will be required to change this password when you log in for the first time. This password expires in 7 days.</p>
        <p>Kind regards,<br/>Chihwa Rentals Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return sendEmail(email, `Welcome to Chihwa Rentals — Your ${role} account is ready`, html);
}

module.exports = { sendEmail, sendResetCodeEmail, sendWelcomeEmail };
