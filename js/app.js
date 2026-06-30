(function () {
  const items = window.CLEAR_TONE_SHORTFORMS || [];
  const grid = document.querySelector("#shortformGrid");
  const select = document.querySelector("#itemSelect");
  const widthInput = document.querySelector("#embedWidth");
  const heightInput = document.querySelector("#embedHeight");
  const codeOutput = document.querySelector("#embedCode");
  const copyButton = document.querySelector("#copyButton");
  const heroFrame = document.querySelector("#heroFrame");

  function embedUrl(itemId) {
    const base = new URL("./embed.html", window.location.href);
    base.searchParams.set("item", itemId);
    return base.href;
  }

  function renderGrid() {
    grid.innerHTML = items.map((item) => `
      <article class="shortform-card">
        <iframe
          title="${escapeHtml(item.brand)} 숏폼 미리보기"
          src="./embed.html?item=${encodeURIComponent(item.id)}&preview=1"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
        <div class="shortform-meta">
          <strong>${escapeHtml(item.brand)}</strong>
          <span>${escapeHtml(item.description)}</span>
          <button class="button secondary" type="button" data-select="${escapeHtml(item.id)}">이 카드 선택</button>
        </div>
      </article>
    `).join("");
  }

  function renderSelect() {
    select.innerHTML = items.map((item) => (
      `<option value="${escapeHtml(item.id)}">${escapeHtml(item.brand)} - ${escapeHtml(item.title)}</option>`
    )).join("");
  }

  function renderCode() {
    const itemId = select.value || items[0]?.id || "";
    const width = Math.max(280, Number(widthInput.value) || 360);
    const height = Math.max(480, Number(heightInput.value) || 640);
    const code = `<iframe
  src="${embedUrl(itemId)}"
  width="${width}"
  height="${height}"
  style="border:0;border-radius:24px;overflow:hidden"
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>`;

    codeOutput.value = code;
    if (heroFrame) {
      heroFrame.src = `./embed.html?item=${encodeURIComponent(itemId)}&preview=1`;
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  renderGrid();
  renderSelect();
  renderCode();

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select]");
    if (!button) return;

    select.value = button.dataset.select;
    renderCode();
    document.querySelector("#embed").scrollIntoView({ behavior: "smooth" });
  });

  [select, widthInput, heightInput].forEach((field) => {
    field.addEventListener("input", renderCode);
  });

  copyButton.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(codeOutput.value);
    } catch (error) {
      codeOutput.select();
      document.execCommand("copy");
    }
    copyButton.textContent = "복사 완료";
    window.setTimeout(() => {
      copyButton.textContent = "코드 복사";
    }, 1400);
  });
}());
