(() => {
  const coupon = document.body.dataset.coupon;
  const form = document.getElementById("registration-form");
  const message = document.getElementById("form-message");
  const submitBtn = document.getElementById("submit-btn");

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

    if (!nome) {
      setMessage("Informe seu nome completo.", "error");
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
        setMessage(data.error || "As vagas esgotaram.", "error");
      } else {
        setMessage(data.error || "Não foi possível concluir a inscrição.", "error");
      }
    } catch {
      setMessage("Falha de conexão. Tente novamente em instantes.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar inscrição";
    }
  });
})();
