import { getStore } from "@netlify/blobs";

const COUPONS = {
  HASHTAG10: { label: "#hashtag entrega", limit: 10 },
  LIBERDATA10: { label: "LiberData", limit: 10 },
  SUPPRI10: { label: "Suppri", limit: 10 },
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

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

  const listKey = `list-${coupon}`;
  const list = JSON.parse((await store.get(listKey)) || "[]");
  list.push({ nome, empresa, ts: Date.now() });
  await store.set(listKey, JSON.stringify(list));

  return json(200, {
    ok: true,
    remaining: COUPONS[coupon].limit - next,
  });
};
