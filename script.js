(() => {
  const LIMIT = 10;
  const couponCards = document.querySelectorAll(".coupon-card");

  async function loadStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) return;
      const data = await res.json();
      applyStatus(data);
    } catch {
      // silencioso: se a função ainda não estiver no ar (ex: preview local sem functions),
      // a página continua utilizável, só sem contagem ao vivo.
    }
  }

  function applyStatus(data) {
    couponCards.forEach((card) => {
      const code = card.dataset.coupon;
      const info = data[code];
      if (!info) return;
      updateCard(card, info);
    });
  }

  function updateCard(card, info) {
    const bar = card.querySelector("[data-bar]");
    const remainingEl = card.querySelector("[data-remaining]");
    const link = card.querySelector("a.btn");
    const usedPct = Math.min(100, (info.used / LIMIT) * 100);
    bar.style.width = `${usedPct}%`;
    bar.closest(".progress").setAttribute("aria-valuenow", info.used);

    if (info.remaining <= 0) {
      remainingEl.textContent = "Vagas esgotadas";
      card.classList.add("is-sold-out");
      if (link) link.textContent = "Vagas esgotadas";
    } else {
      remainingEl.textContent = `${info.remaining} de ${LIMIT} vagas disponíveis`;
      card.classList.remove("is-sold-out");
    }
  }

  loadStatus();
})();
