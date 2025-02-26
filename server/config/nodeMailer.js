 import nodemailer from 'nodemailer';

// Create a transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, // Replace with your email
    pass: process.env.SMTP_PASS, // Replace with your app password (not your actual password)
  },
});


 export default transporter;