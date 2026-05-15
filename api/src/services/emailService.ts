import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  toEmail: string,
  userName: string,
  resetToken: string
) {
  const resetUrl = `${process.env.CORS_ORIGIN}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from: `"Bolão Copa 2026" <${process.env.FROM_EMAIL}>`,
    to: toEmail,
    subject: 'Bolão Copa 2026 — Recuperar senha',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #fff; padding: 32px; border-radius: 12px;">
        <h2 style="color: #f5c842;">Bolão Copa 2026 ⚽</h2>
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
        <a href="${resetUrl}"
           style="display:inline-block; background:#f5c842; color:#0a0a0f; padding:12px 24px;
                  border-radius:8px; font-weight:700; text-decoration:none; margin: 16px 0;">
          Redefinir senha
        </a>
        <p style="color:#888; font-size:13px;">Este link expira em <strong>1 hora</strong>.</p>
        <p style="color:#888; font-size:13px;">Se você não solicitou isso, ignore este email.</p>
      </div>
    `,
  });
}