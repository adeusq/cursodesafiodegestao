import { getStore } from "@netlify/blobs";

const COUPONS = ["HASHTAG10", "LIBERDATA10", "SUPPRI10"];

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { error: "Método não permitido." });
  }

  const adminKey = process.env.ADMIN_KEY;
  const providedKey = req.headers.get("x-admin-key");
  if (!adminKey || providedKey !== adminKey) {
    return json(401, { error: "Não autorizado." });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Dados inválidos." });
  }

  const requested = String(body?.coupon || "").toUpperCase().trim();
  const targets = requested === "ALL" ? COUPONS : COUPONS.includes(requested) ? [requested] : null;

  if (!targets) {
    return json(400, { error: "Cupom inválido." });
  }

  const store = getStore("inscricoes-food-service");
  for (const coupon of targets) {
    await store.delete(`count-${coupon}`);
    await store.delete(`list-${coupon}`);
  }

  return json(200, { ok: true, reset: targets });
};
