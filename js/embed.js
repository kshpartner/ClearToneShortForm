(function () {
  const items = window.CLEAR_TONE_SHORTFORMS || [];
  const params = new URLSearchParams(window.location.search);
  const requestedId = params.get("item") || items[0]?.id;
  const item = items.find((entry) => entry.id === requestedId) || items[0];
  const shell = document.querySelector("#embedShell");

  if (!item) {
    shell.innerHTML = '<div class="embed-error">표시할 숏폼 데이터가 없습니다.</div>';
    return;
  }

  const validYoutubeId = /^[a-zA-Z0-9_-]{11}$/.test(item.youtubeId || "");
  const preview = params.get("preview") === "1";
  const autoplay = params.get("autoplay") === "1" && !preview;
  const videoUrl = validYoutubeId
    ? `https://www.youtube-nocookie.com/embed/${item.youtubeId}?playsinline=1&rel=0&modestbranding=1&autoplay=${autoplay ? "1" : "0"}&mute=${autoplay ? "1" : "0"}`
    : "";

  shell.innerHTML = `
    <section class="video-stage" aria-label="${escapeHtml(item.brand)} 숏폼 영상">
      ${validYoutubeId ? `
        <iframe
          title="${escapeHtml(item.brand)} YouTube 영상"
          src="${videoUrl}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      ` : `
        <div class="fallback-poster">
          <strong>${escapeHtml(item.brand)}<br>${escapeHtml(item.title)}</strong>
        </div>
      `}
    </section>
    <div class="embed-gradient"></div>
    <a class="product-card" href="${escapeAttr(item.productUrl)}" target="_blank" rel="noopener">
      <img src="${escapeAttr(item.image)}" alt="">
      <div class="product-copy">
        <span>${escapeHtml(item.brand)}</span>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description)}</p>
      </div>
    </a>
  `;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }
}());
