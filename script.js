(() => {
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
    const link = card.querySelector("a.btn");
    if (info.remaining <= 0) {
      card.classList.add("is-sold-out");
      if (link) {
        link.textContent = "Vagas esgotadas";
        link.setAttribute("aria-disabled", "true");
      }
    } else {
      card.classList.remove("is-sold-out");
      if (link) link.removeAttribute("aria-disabled");
    }
  }

  loadStatus();
})();
