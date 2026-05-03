import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || "smtp.gmail.com",
  port:   parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"BET Academy" <${process.env.SMTP_USER}>`;
const DASH_URL = process.env.DASHBOARD_URL || "https://dashboard.bet-academy.ci";

// ── Email de bienvenue pour un nouveau coach ─────────────────
export async function sendCoachWelcomeEmail({ prenom, nom, email, mdpTemp }) {
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;background:#f0f9ff;margin:0;padding:0;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0891b2,#0e7490);padding:32px 36px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">BET Academy</div>
      <div style="font-size:13px;color:#bae6fd;margin-top:4px;">British English Training</div>
    </div>

    <!-- Corps -->
    <div style="padding:36px;">
      <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 8px;">Bonjour ${prenom} ${nom} 👋</p>
      <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 24px;">
        Votre profil coach vient d'être créé sur la plateforme <strong>BET Academy</strong>.
        Vous pouvez dès maintenant accéder à votre espace avec les identifiants ci-dessous.
      </p>

      <!-- Identifiants -->
      <div style="background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Vos identifiants de connexion</div>
        <div style="margin-bottom:10px;">
          <span style="font-size:11px;color:#9ca3af;">Email</span><br/>
          <span style="font-size:14px;font-weight:700;color:#0f172a;">${email}</span>
        </div>
        <div>
          <span style="font-size:11px;color:#9ca3af;">Mot de passe temporaire</span><br/>
          <span style="font-size:16px;font-weight:800;color:#0891b2;letter-spacing:2px;font-family:monospace;">${mdpTemp}</span>
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${DASH_URL}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0891b2,#0e7490);color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
          🚀 Accéder à mon espace
        </a>
      </div>

      <!-- Avertissement -->
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:12px;color:#92400e;">
          ⚠️ <strong>Changez votre mot de passe</strong> dès votre première connexion pour sécuriser votre compte.
        </p>
      </div>

      <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
        En cas de problème de connexion, contactez votre responsable pédagogique ou écrivez-nous à
        <a href="mailto:${process.env.SMTP_USER}" style="color:#0891b2;">${process.env.SMTP_USER}</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">© ${new Date().getFullYear()} BET Academy · British English Training, Abidjan</p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `🎓 Bienvenue chez BET Academy — Vos accès coach`,
    html,
  });
}
