(function () {
  const items = window.CLEAR_TONE_SHORTFORMS || [];
  const page = document.querySelector("#embedPage");
  const params = new URLSearchParams(window.location.search);
  const autoplay = params.get("autoplay") !== "0";
  const preview = params.get("preview") === "1";
  const loop = params.get("loop") !== "0";

  if (!items.length) {
    page.innerHTML = '<div class="embed-empty">등록된 숏폼이 없습니다.</div>';
    return;
  }

  page.innerHTML = `
    <section class="embed-board" aria-label="ClearTone 숏폼 모음">
      <div class="embed-board-head">
        <p>ClearTone ShortForm</p>
        <span>${items.length} videos</span>
      </div>
      <div class="shortform-shell">
        <div class="shortform-rail" tabindex="0">
          ${items.map(renderCard).join("")}
        </div>
      </div>
    </section>
  `;

  setupRailControls();

  function renderCard(item, index) {
    const source = normalizeEmbedUrl(item.embedUrl, autoplay && !preview, loop);
    const imageSource = resolveProductImage(item.image);
    const hasImage = Boolean(imageSource);
    const hasProductUrl = Boolean((item.productUrl || "").trim());

    return `
      <article class="story-card">
        <div class="story-media">
          ${source ? `
            <iframe
              title="${escapeHtml(item.brand || "ClearTone")} ${index + 1}"
              src="${escapeAttr(source)}"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          ` : `
            <div class="fallback-poster">
              <strong>${escapeHtml(item.brand || "ClearTone")}<br>${escapeHtml(item.title || "ShortForm")}</strong>
            </div>
          `}
        </div>
        <div class="story-shade"></div>
        <div class="story-drag-cover" aria-hidden="true"></div>
        <div class="story-product">
          <div class="story-product-main ${hasImage ? "" : "no-image"}">
            ${hasImage ? `<div class="story-thumb"><img src="${escapeAttr(imageSource)}" alt=""></div>` : ""}
            <div class="story-copy">
              <span>${escapeHtml(item.brand || "ClearTone")}</span>
              <strong>${escapeHtml(item.title || "")}</strong>
              <p>${escapeHtml(item.description || "")}</p>
            </div>
          </div>
          ${hasProductUrl ? `
            <a class="story-cta" href="${escapeAttr(item.productUrl)}" target="_blank" rel="noopener">
              제품 보러가기
              <span aria-hidden="true">↗</span>
            </a>
          ` : ""}
        </div>
      </article>
    `;
  }

  function setupRailControls() {
    const rail = page.querySelector(".shortform-rail");
    if (!rail) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    rail.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") return;
      isDragging = true;
      startX = event.clientX;
      startScrollLeft = rail.scrollLeft;
      rail.classList.add("is-dragging");
      rail.setPointerCapture(event.pointerId);
    });

    rail.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      rail.scrollLeft = startScrollLeft - (event.clientX - startX);
    });

    rail.addEventListener("pointerup", (event) => {
      isDragging = false;
      rail.classList.remove("is-dragging");
      if (rail.hasPointerCapture(event.pointerId)) {
        rail.releasePointerCapture(event.pointerId);
      }
    });

    rail.addEventListener("pointercancel", () => {
      isDragging = false;
      rail.classList.remove("is-dragging");
    });
  }

  function normalizeEmbedUrl(value, shouldAutoplay, shouldLoop) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, "");
      let videoId = "";

      if (host === "youtu.be") {
        videoId = url.pathname.split("/").filter(Boolean)[0] || "";
      }

      if (host === "youtube.com" || host === "youtube-nocookie.com") {
        const parts = url.pathname.split("/").filter(Boolean);
        if (url.pathname === "/watch") videoId = url.searchParams.get("v") || "";
        if (parts[0] === "shorts" || parts[0] === "embed") videoId = parts[1] || "";
      }

      if (/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
        embed.searchParams.set("playsinline", "1");
        embed.searchParams.set("rel", "0");
        embed.searchParams.set("modestbranding", "1");
        embed.searchParams.set("controls", "0");
        if (shouldAutoplay) {
          embed.searchParams.set("autoplay", "1");
          embed.searchParams.set("mute", "1");
        }
        if (shouldLoop) {
          embed.searchParams.set("loop", "1");
          embed.searchParams.set("playlist", videoId);
        }
        return embed.href;
      }

      if (shouldAutoplay) {
        url.searchParams.set("autoplay", "1");
        url.searchParams.set("mute", "1");
        url.searchParams.set("muted", "1");
      }
      if (shouldLoop) {
        url.searchParams.set("loop", "1");
      }
      return url.href;
    } catch (error) {
      return raw;
    }
  }

  function resolveProductImage(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(https?:)?\/\//.test(raw) || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../")) {
      return raw;
    }
    return `./products/${raw}`;
  }

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
