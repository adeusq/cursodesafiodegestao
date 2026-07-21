import { getStore } from "@netlify/blobs";

const COUPONS = ["HASHTAG10", "LIBERDATA10", "SUPPRI10"];
const LIMIT = 10;

export default async () => {
  const store = getStore("inscricoes-food-service");
  const result = {};

  for (const coupon of COUPONS) {
    const current = parseInt((await store.get(`count-${coupon}`)) || "0", 10);
    result[coupon] = { used: current, remaining: Math.max(0, LIMIT - current), limit: LIMIT };
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
