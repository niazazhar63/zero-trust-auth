import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendRejectionEmail = async (to, reason) => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to,
    subject: "Request Rejected",
    text: `Hello,\n\nYour request has been rejected.\nReason: ${reason || "Not specified"}\n\nRegards,\nAdmin`,
  };

  await transporter.sendMail(mailOptions);
};
