(() => {
  const LIMIT = 10;
  const couponCards = document.querySelectorAll(".coupon-card");
  const form = document.getElementById("registration-form");
  const message = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");

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
    const button = card.querySelector("[data-use-coupon]");
    const usedPct = Math.min(100, (info.used / LIMIT) * 100);
    bar.style.width = `${usedPct}%`;
    bar.closest(".progress").setAttribute("aria-valuenow", info.used);

    if (info.remaining <= 0) {
      remainingEl.textContent = "Vagas esgotadas";
      card.classList.add("is-sold-out");
      if (button) {
        button.disabled = true;
        button.textContent = "Esgotado";
      }
    } else {
      remainingEl.textContent = `${info.remaining} de ${LIMIT} vagas disponíveis`;
      card.classList.remove("is-sold-out");
      if (button) {
        button.disabled = false;
        button.textContent = "Já tenho o código";
      }
    }
  }

  couponCards.forEach((card) => {
    const button = card.querySelector("[data-use-coupon]");
    if (!button) return;
    button.addEventListener("click", () => {
      document.getElementById("inscricao").scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("coupon").focus({ preventScroll: true });
    });
  });

  function setMessage(text, state) {
    message.textContent = text;
    if (state) {
      message.dataset.state = state;
    } else {
      delete message.dataset.state;
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("", null);

    const nome = document.getElementById("nome").value.trim();
    const empresa = document.getElementById("empresa").value.trim();
    const coupon = document.getElementById("coupon").value.trim();

    if (!nome) {
      setMessage("Informe seu nome completo.", "error");
      return;
    }
    if (!coupon) {
      setMessage("Informe o código do cupom.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, empresa, coupon }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage("Inscrição confirmada! Nos vemos dia 29/07, às 19h, no Cabaña Del Primo.", "success");
        form.reset();
      } else if (res.status === 409) {
        setMessage(data.error || "Esse cupom esgotou.", "error");
      } else {
        setMessage(data.error || "Não foi possível concluir a inscrição.", "error");
      }
    } catch {
      setMessage("Falha de conexão. Tente novamente em instantes.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar inscrição";
      loadStatus();
    }
  });

  loadStatus();
})();
