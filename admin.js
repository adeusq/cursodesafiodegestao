(() => {
  const STORAGE_KEY = "nm-admin-key";
  const COUPON_LABELS = {
    HASHTAG10: "#hashtag entrega",
    LIBERDATA10: "Liberdata",
    SUPPRI10: "Suppri",
  };

  const gate = document.getElementById("gate");
  const gateForm = document.getElementById("gate-form");
  const gateMessage = document.getElementById("gate-message");
  const panel = document.getElementById("panel");
  const summary = document.getElementById("summary");
  const tableBody = document.getElementById("table-body");
  const emptyMessage = document.getElementById("empty-message");
  const refreshBtn = document.getElementById("refresh-btn");
  const exportBtn = document.getElementById("export-btn");
  const resetAllBtn = document.getElementById("reset-all-btn");
  const logoutBtn = document.getElementById("logout-btn");

  let currentData = null;

  function getKey() {
    return sessionStorage.getItem(STORAGE_KEY);
  }

  function showGate(message) {
    panel.hidden = true;
    gate.hidden = false;
    gateMessage.textContent = message || "";
    gateMessage.dataset.state = message ? "error" : "";
  }

  function showPanel() {
    gate.hidden = true;
    panel.hidden = false;
    window.scrollTo(0, 0);
  }

  async function loadData(key) {
    let res;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      res = await fetch("/api/admin-list", {
        headers: { "x-admin-key": key },
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (err) {
      showGate("Falha de conexão ao verificar a chave. Tente novamente (desative bloqueadores/extensões se persistir).");
      return;
    }

    if (res.status === 401) {
      sessionStorage.removeItem(STORAGE_KEY);
      showGate("Chave inválida.");
      return;
    }

    if (!res.ok) {
      showGate("Não foi possível carregar as inscrições. Tente novamente.");
      return;
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      showGate("Resposta inesperada do servidor. Tente novamente.");
      return;
    }

    currentData = data;
    sessionStorage.setItem(STORAGE_KEY, key);
    render(data);
    showPanel();
  }

  async function resetCoupon(coupon) {
    const key = getKey();
    if (!key) return;

    const res = await fetch("/api/admin-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ coupon }),
    });

    if (res.status === 401) {
      sessionStorage.removeItem(STORAGE_KEY);
      showGate("Chave inválida.");
      return;
    }

    if (!res.ok) {
      alert("Não foi possível resetar. Tente novamente.");
      return;
    }

    loadData(key);
  }

  function render(data) {
    const counts = {};
    data.registrations.forEach((r) => {
      counts[r.coupon] = (counts[r.coupon] || 0) + 1;
    });

    summary.innerHTML = "";

    const totalCard = document.createElement("div");
    totalCard.className = "admin-summary__card admin-summary__card--total";
    totalCard.innerHTML = `<span class="admin-summary__value">${data.total}</span><span class="admin-summary__label">Total de inscritos</span>`;
    summary.appendChild(totalCard);

    Object.keys(COUPON_LABELS).forEach((coupon) => {
      const card = document.createElement("div");
      card.className = "admin-summary__card";
      card.innerHTML = `
        <span class="admin-summary__value">${counts[coupon] || 0}/10</span>
        <span class="admin-summary__label">${COUPON_LABELS[coupon]}</span>
        <button type="button" class="admin-summary__reset" data-reset-coupon="${coupon}">Resetar</button>
      `;
      summary.appendChild(card);
    });

    summary.querySelectorAll("[data-reset-coupon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const coupon = btn.dataset.resetCoupon;
        const label = COUPON_LABELS[coupon] || coupon;
        if (confirm(`Resetar as vagas e inscrições do cupom "${label}"? Essa ação não pode ser desfeita.`)) {
          resetCoupon(coupon);
        }
      });
    });

    tableBody.innerHTML = "";
    if (!data.registrations.length) {
      emptyMessage.hidden = false;
    } else {
      emptyMessage.hidden = true;
      data.registrations.forEach((r, i) => {
        const tr = document.createElement("tr");
        const when = new Date(r.ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${escapeHtml(r.nome)}</td>
          <td>${escapeHtml(r.empresa || "—")}</td>
          <td>${escapeHtml(COUPON_LABELS[r.coupon] || r.coupon)}</td>
          <td>${when}</td>
          <td>${emailStatusLabel(r.emailSent)}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  function emailStatusLabel(emailSent) {
    if (emailSent === undefined) return "—";
    return emailSent ? "✅ Enviado" : "❌ Falhou";
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function toCsv(data) {
    const rows = [["Nome", "Empresa", "Apoiador", "Inscrito em", "Email enviado"]];
    data.registrations.forEach((r) => {
      rows.push([
        r.nome,
        r.empresa || "",
        COUPON_LABELS[r.coupon] || r.coupon,
        new Date(r.ts).toISOString(),
        r.emailSent === undefined ? "" : r.emailSent ? "sim" : "não",
      ]);
    });
    return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
  }

  function csvEscape(value) {
    const str = String(value ?? "");
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  gateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const key = document.getElementById("admin-key").value.trim();
    if (!key) return;
    gateMessage.textContent = "Verificando…";
    delete gateMessage.dataset.state;
    loadData(key);
  });

  refreshBtn.addEventListener("click", () => {
    const key = getKey();
    if (key) loadData(key);
  });

  exportBtn.addEventListener("click", () => {
    if (!currentData || !currentData.registrations.length) return;
    const csv = toCsv(currentData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inscricoes-negocios-a-mesa.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  resetAllBtn.addEventListener("click", () => {
    if (confirm("Resetar TODOS os cupons (vagas e inscrições)? Essa ação não pode ser desfeita.")) {
      resetCoupon("ALL");
    }
  });

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(STORAGE_KEY);
    currentData = null;
    showGate();
  });

  const storedKey = getKey();
  if (storedKey) {
    loadData(storedKey);
  }
})();
