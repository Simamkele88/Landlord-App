const nodemailer = require("nodemailer");

const emailSender = process.env.EMAIL_SENDER || "noreplyconveniencyinc@gmail.com";
const emailPassword = process.env.EMAIL_PASSWORD || "vyfddhrzjphejurd";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailSender,
    pass: emailPassword,
  },
});

module.exports = { transporter, emailSender };
