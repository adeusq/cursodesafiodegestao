import { getStore } from "@netlify/blobs";

const COUPONS = ["HASHTAG10", "LIBERDATA10", "SUPPRI10"];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers.get("x-admin-key");

  if (!adminKey || providedKey !== adminKey) {
    return json(401, { error: "Não autorizado." });
  }

  const store = getStore("inscricoes-food-service");
  const registrations = [];

  for (const coupon of COUPONS) {
    const list = JSON.parse((await store.get(`list-${coupon}`)) || "[]");
    for (const entry of list) {
      registrations.push({ nome: entry.nome, empresa: entry.empresa, coupon, ts: entry.ts });
    }
  }

  registrations.sort((a, b) => a.ts - b.ts);

  return json(200, { registrations, total: registrations.length });
};
