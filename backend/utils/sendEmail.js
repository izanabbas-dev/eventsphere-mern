import nodemailer from "nodemailer";

// If SMTP is not set in .env, the email is only printed in the console
const sendEmail = async ({ to, subject, text }) => {
  if (!process.env.SMTP_HOST) {
    console.log(`Email (SMTP not set)\nTo: ${to}\nSubject: ${subject}\n\n${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
};

export default sendEmail;
