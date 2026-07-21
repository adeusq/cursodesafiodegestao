import { getStore } from "@netlify/blobs";
import nodemailer from "nodemailer";

const COUPONS = {
  HASHTAG10: { label: "#hashtag entrega", limit: 10 },
  LIBERDATA10: { label: "Liberdata", limit: 10 },
  SUPPRI10: { label: "Suppri", limit: 10 },
};

const COUPON_CONTACTS = {
  HASHTAG10: "davi.duarte@hashtagentrega.com",
  LIBERDATA10: "setormarketing.liber@gmail.com",
  SUPPRI10: "pedro.maranhao@usesuppri.com.br",
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let cachedTransporter;

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const user = process.env.EMAIL;
  const pass = process.env.SENHA;

  cachedTransporter = user && pass
    ? nodemailer.createTransport({ service: "gmail", auth: { user, pass } })
    : null;

  return cachedTransporter;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(coupon, nome, empresa) {
  const label = escapeHtml(COUPONS[coupon].label);
  const safeNome = escapeHtml(nome);
  const safeEmpresa = escapeHtml(empresa || "Não informado");

  return `
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f2f1ea;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(10,20,30,0.08);">
          <tr>
            <td style="background:#0a5570;padding:24px 32px;">
              <p style="margin:0;color:#ffcc00;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Negócios à Mesa</p>
              <p style="margin:6px 0 0;color:#ffffff;font-size:18px;font-weight:bold;">Nova inscrição recebida</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <p style="margin:0 0 20px;color:#5c5468;font-size:14px;">
                Uma nova pessoa se inscreveu no evento pela página de
                <strong style="color:#0a5570;">${label}</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:12px 16px;background:#f2f1ea;border-radius:10px 10px 0 0;border-left:4px solid #ffcc00;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#5c5468;font-weight:bold;">Nome</p>
                    <p style="margin:2px 0 0;font-size:15px;color:#14121a;font-weight:bold;">${safeNome}</p>
                  </td>
                </tr>
                <tr>
                  <td style="height:2px;background:#ffffff;"></td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;background:#f2f1ea;border-radius:0 0 10px 10px;border-left:4px solid #ffcc00;">
                    <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#5c5468;font-weight:bold;">Empresa</p>
                    <p style="margin:2px 0 0;font-size:15px;color:#14121a;font-weight:bold;">${safeEmpresa}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0;font-size:13px;color:#5c5468;line-height:1.6;">
                <strong style="color:#14121a;">Negócios à Mesa: Os Desafios da Gestão Eficiente no Food Service</strong><br>
                29 de julho de 2026 &middot; 19h &middot; Cabaña Del Primo
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#000000;padding:14px 32px;">
              <p style="margin:0;font-size:11px;color:#9aa0ad;">Email automático — não é preciso responder.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function notifyResponsible(coupon, nome, empresa) {
  const to = COUPON_CONTACTS[coupon];
  const transporter = getTransporter();
  if (!to || !transporter) return false;

  try {
    await transporter.sendMail({
      from: `"Negócios à Mesa" <${process.env.EMAIL}>`,
      to,
      subject: `Nova inscrição — Negócios à Mesa (${COUPONS[coupon].label})`,
      text: [
        `Nova inscrição via ${COUPONS[coupon].label}:`,
        "",
        `Nome: ${nome}`,
        `Empresa: ${empresa || "não informado"}`,
        "",
        "Negócios à Mesa: Os Desafios da Gestão Eficiente no Food Service",
        "29 de julho, 19h — Cabaña Del Primo",
      ].join("\n"),
      html: buildEmailHtml(coupon, nome, empresa),
    });
    return true;
  } catch (err) {
    console.error(`Falha ao enviar email para ${to}:`, err.message);
    return false;
  }
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Dados inválidos." });
  }

  const nome = (body?.nome || "").trim();
  const empresa = (body?.empresa || "").trim();
  const coupon = String(body?.coupon || "").toUpperCase().trim();

  if (!nome) {
    return json(400, { error: "Informe seu nome." });
  }
  if (!COUPONS[coupon]) {
    return json(400, { error: "Cupom inválido." });
  }

  const store = getStore("inscricoes-food-service");
  const countKey = `count-${coupon}`;

  const current = parseInt((await store.get(countKey)) || "0", 10);
  if (current >= COUPONS[coupon].limit) {
    return json(409, { error: "Esse cupom já esgotou as 10 vagas.", remaining: 0 });
  }

  const next = current + 1;
  await store.set(countKey, String(next));

  const emailSent = await notifyResponsible(coupon, nome, empresa);

  const listKey = `list-${coupon}`;
  const list = JSON.parse((await store.get(listKey)) || "[]");
  list.push({ nome, empresa, ts: Date.now(), emailSent });
  await store.set(listKey, JSON.stringify(list));

  return json(200, {
    ok: true,
    remaining: COUPONS[coupon].limit - next,
  });
};
