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
  return sendEmail(
    email,
    `Welcome to Chihwa Rentals — Your ${role} account is ready`,
    html,
  );
}

async function sendLeaseCreatedEmail({
  email,
  fullName,
  leaseStartDate,
  leaseEndDate,
  rentAmount,
  paymentFrequency,
  paymentDueDay,
  rentInvoiceDueDate,
  depositAmount = null,
  depositInvoiceDueDate = null,
}) {
  const formattedRent = `R ${Number(rentAmount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  const formattedDeposit = depositAmount
    ? `R ${Number(depositAmount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`
    : null;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Lease Created</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; margin: 0; padding: 24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p>Hello ${fullName},</p>
        <p>Your lease has been successfully created on Chihwa Rentals. Below are the details:</p>

        <table style="border-collapse: collapse; margin: 20px 0; width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Lease Start Date</strong></td>
            <td style="padding: 8px; border: 1px solid #dddddd;">${leaseStartDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Lease End Date</strong></td>
            <td style="padding: 8px; border: 1px solid #dddddd;">${leaseEndDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Monthly Rent</strong></td>
            <td style="padding: 8px; border: 1px solid #dddddd;">${formattedRent}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Payment Frequency</strong></td>
            <td style="padding: 8px; border: 1px solid #dddddd;">${paymentFrequency}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #dddddd; background-color: #f9f9f9;"><strong>Payment Due Day</strong></td>
            <td style="padding: 8px; border: 1px solid #dddddd;">${paymentDueDay}</td>
          </tr>
        </table>

        <p><strong>First Rent Invoice</strong></p>
        <p>Amount due: ${formattedRent} | Due date: ${rentInvoiceDueDate}</p>

        ${
          depositAmount
            ? `
        <p><strong>Deposit Invoice</strong></p>
        <p>Amount due: ${formattedDeposit} | Due date: ${depositInvoiceDueDate}</p>
        `
            : ""
        }

        <p>Please log in to your tenant portal to view and pay your invoices.</p>
        <p>Kind regards,<br/>Chihwa Rentals Team</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return sendEmail(email, "Your New Lease Details", html);
}

async function sendLateFeeAppliedEmail({ email, fullName, amount }) {
  const formattedAmount = `R ${Number(amount).toFixed(2)}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; padding: 24px;">
  <p>Hello ${fullName},</p>
  <p>A late fee of <strong>${formattedAmount}</strong> has been applied to your overdue invoice.</p>
  <p>Please log in to your tenant portal to view the updated balance and make payment.</p>
  <p>Kind regards,<br/>Chihwa Rentals Team</p>
</body>
</html>`;
  return sendEmail(email, "Late Fee Applied", html);
}

async function sendInvoiceCreatedEmail({
  email,
  fullName,
  invoiceType,
  amount,
  dueDate,
  notes,
}) {
  const formattedAmount = `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; padding: 24px;">
  <p>Hello ${fullName},</p>
  <p>A new invoice has been created on your account.</p>
  <table style="border-collapse: collapse; margin: 20px 0; width: 100%;">
    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Invoice Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${invoiceType}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${formattedAmount}</td></tr>
    <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${dueDate}</td></tr>
    ${notes ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Notes</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${notes}</td></tr>` : ""}
  </table>
  <p>Please log in to your tenant portal to view and pay this invoice.</p>
  <p>Kind regards,<br/>Chihwa Rentals Team</p>
</body>
</html>`;
  return sendEmail(email, "New Invoice Created", html);
}

module.exports = {
  sendEmail,
  sendResetCodeEmail,
  sendWelcomeEmail,
  sendInvoiceCreatedEmail,
  sendLateFeeAppliedEmail,
};
