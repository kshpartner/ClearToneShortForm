(function () {
  const widthInput = document.querySelector("#embedWidth");
  const heightInput = document.querySelector("#embedHeight");
  const codeOutput = document.querySelector("#embedCode");
  const copyButton = document.querySelector("#copyButton");
  const ASSET_VERSION = "20260630-no-scrollbar";

  function embedUrl() {
    const url = new URL("./embed.html", window.location.href);
    url.searchParams.set("v", ASSET_VERSION);
    return url.href;
  }

  function renderCode() {
    const width = widthInput.value.trim() || "100%";
    const height = Math.max(420, Number(heightInput.value) || 720);
    codeOutput.value = `<iframe
  src="${embedUrl()}"
  width="${escapeAttr(width)}"
  height="${height}"
  style="border:0;border-radius:18px;overflow:hidden;width:${escapeAttr(width)};max-width:100%"
  loading="lazy"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen>
</iframe>`;
  }

  function escapeAttr(value) {
    return String(value).replace(/"/g, "&quot;");
  }

  [widthInput, heightInput].forEach((field) => {
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

  renderCode();
}());
