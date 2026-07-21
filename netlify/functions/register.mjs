import { getStore } from "@netlify/blobs";
import nodemailer from "nodemailer";

const COUPONS = {
  HASHTAG10: { label: "#hashtag entrega", limit: 10 },
  LIBERDATA10: { label: "Liberdata", limit: 10 },
  SUPPRI10: { label: "Suppri", limit: 10 },
};

const COUPON_CONTACTS = {
  HASHTAG10: "adeusqm@gmail.com",
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

async function notifyResponsible(coupon, nome, empresa) {
  const to = COUPON_CONTACTS[coupon];
  const transporter = getTransporter();
  if (!to || !transporter) return false;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
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
