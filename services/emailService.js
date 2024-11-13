// src/services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const enviarCorreoRecuperacion = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/restablecer-contrasena?token=${token}`;

  const mailOptions = {
    from: `"Soporte UCM" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de Contraseña',
    html: `
      <h2>Recuperación de Contraseña</h2>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}">Restablecer Contraseña</a>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
      <p>El enlace expirará en 1 hora.</p>
    `
  };

  return transporter.sendMail(mailOptions);
};