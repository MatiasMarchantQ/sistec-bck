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

// Agrega este método en src/services/emailService.js
export const enviarCredencialesEstudiante = async (estudiante, contrasena) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const mailOptions = {
    from: `"Soporte UCM" <${process.env.EMAIL_USER}>`,
    to: estudiante.correo,
    subject: 'Credenciales de Acceso - Plataforma Telecuidado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenido/a ${estudiante.nombres} ${estudiante.apellidos}</h2>
        <p>Se ha creado tu cuenta en la Plataforma Telecuidado.</p>
        
        <h3>Tus Credenciales de Acceso</h3>
        <p><strong>Usuario (RUT sin puntos, ni guión ni dígito verificador):</strong> ${estudiante.rut}</p>
        <p><strong>Contraseña Temporal:</strong> ${contrasena}</p>
        
        <div style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
          <strong>Importante:</strong>
          <ul>
            <li>Cambia tu contraseña al primer inicio de sesión</li>
            <li>La contraseña es temporal y debe ser modificada</li>
          </ul>
        </div>

        <p>Ingresa a la plataforma aquí: <a href="${loginUrl}">Iniciar Sesión</a></p>
        
        <p style="color: #666; font-size: 12px;">
          Si no solicitaste esta cuenta, por favor contacta con soporte.
        </p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
};