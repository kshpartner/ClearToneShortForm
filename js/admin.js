(function () {
  const fields = {
    token: document.querySelector("#githubToken"),
    repo: document.querySelector("#repoFullName"),
    branch: document.querySelector("#repoBranch"),
    path: document.querySelector("#dataPath"),
    embedUrl: document.querySelector("#embedUrl"),
    image: document.querySelector("#image"),
    productUpload: document.querySelector("#productUpload"),
    productLabel: document.querySelector("#productLabel"),
    productUrl: document.querySelector("#productUrl"),
    brand: document.querySelector("#brand"),
    title: document.querySelector("#title"),
    description: document.querySelector("#description")
  };

  const itemList = document.querySelector("#itemList");
  const statusText = document.querySelector("#statusText");
  const previewFrame = document.querySelector("#previewFrame");
  const previewStage = document.querySelector("#previewStage");
  const ADMIN_CACHE_KEY = "clearToneShortformAdminState:v1";
  const ASSET_VERSION = "20260630-brand-color";
  const buttons = {
    load: document.querySelector("#loadButton"),
    save: document.querySelector("#saveButton"),
    add: document.querySelector("#addButton"),
    delete: document.querySelector("#deleteButton"),
    apply: document.querySelector("#applyButton"),
    preview: document.querySelector("#previewButton"),
    upload: document.querySelector("#uploadButton"),
    desktop: document.querySelector("#desktopPreviewButton"),
    mobile: document.querySelector("#mobilePreviewButton")
  };

  const cachedState = readCachedState();
  let items = clone(cachedState?.items || window.CLEAR_TONE_SHORTFORMS || []);
  let products = clone(cachedState?.products || window.CLEAR_TONE_PRODUCTS || []);
  let selectedIndex = cachedState?.selectedIndex || 0;
  selectedIndex = Math.min(Math.max(selectedIndex, 0), Math.max(items.length - 1, 0));
  let dataSha = "";
  let manifestSha = "";

  fields.token.value = sessionStorage.getItem("clearToneGithubToken") || "";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message) {
    statusText.textContent = message;
  }

  function selectedItem() {
    return items[selectedIndex] || null;
  }

  function readCachedState() {
    try {
      const cached = JSON.parse(localStorage.getItem(ADMIN_CACHE_KEY) || "null");
      if (!cached || !Array.isArray(cached.items)) return null;
      return {
        items: cached.items,
        products: Array.isArray(cached.products) ? cached.products : [],
        selectedIndex: Number.isInteger(cached.selectedIndex) ? cached.selectedIndex : 0
      };
    } catch (error) {
      return null;
    }
  }

  function persistAdminState() {
    try {
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify({
        items,
        products,
        selectedIndex,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      // Storage can be unavailable in private browsing or strict browser modes.
    }
  }

  function renderProducts() {
    const current = fields.image.value;
    const options = [
      '<option value="">이미지 없음</option>',
      ...products.map((product) => (
        `<option value="${escapeHtml(product.name)}">${escapeHtml(product.label || product.name)} (${escapeHtml(product.name)})</option>`
      ))
    ];

    fields.image.innerHTML = options.join("");

    if (current && !products.some((product) => product.name === current)) {
      fields.image.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(current)}">${escapeHtml(current)}</option>`);
    }

    fields.image.value = current || "";
  }

  function renderList() {
    itemList.innerHTML = items.map((item, index) => `
      <button class="item-row ${index === selectedIndex ? "is-active" : ""}" type="button" data-index="${index}">
        <strong>${escapeHtml(item.brand || "브랜드 없음")} · ${escapeHtml(item.title || "제목 없음")}</strong>
        <span>${escapeHtml(item.embedUrl || "임베드 주소 없음")}</span>
      </button>
    `).join("");
  }

  function renderForm() {
    const item = selectedItem();
    fields.embedUrl.value = item?.embedUrl || "";
    fields.image.value = item?.image || "";
    renderProducts();
    fields.productUrl.value = item?.productUrl || "";
    fields.brand.value = item?.brand || "";
    fields.title.value = item?.title || "";
    fields.description.value = item?.description || "";
  }

  function applyForm() {
    if (!selectedItem()) return;
    items[selectedIndex] = {
      id: items[selectedIndex].id || createId(),
      embedUrl: fields.embedUrl.value.trim(),
      image: fields.image.value.trim(),
      productUrl: fields.productUrl.value.trim(),
      brand: fields.brand.value.trim(),
      title: fields.title.value.trim(),
      description: fields.description.value.trim()
    };
    renderList();
    refreshPreview();
    persistAdminState();
    setStatus("현재 카드가 반영되었습니다. 공개 페이지 반영은 GitHub에 저장해야 합니다.");
  }

  function addItem() {
    applyForm();
    items.push({
      id: createId(),
      embedUrl: "",
      image: "",
      productUrl: "",
      brand: "",
      title: "",
      description: ""
    });
    selectedIndex = items.length - 1;
    renderList();
    renderForm();
    persistAdminState();
    setStatus("새 카드를 추가했습니다.");
  }

  function deleteItem() {
    if (!items.length) return;
    items.splice(selectedIndex, 1);
    selectedIndex = Math.max(0, selectedIndex - 1);
    renderList();
    renderForm();
    refreshPreview();
    persistAdminState();
    setStatus("선택한 카드를 삭제했습니다. 공개 페이지 반영은 GitHub에 저장해야 합니다.");
  }

  async function loadFromGithub() {
    const config = readConfig();
    const data = await fetchContent(config, config.path);
    dataSha = data.sha;
    items = parseAssignmentFile(decodeBase64(data.content), "CLEAR_TONE_SHORTFORMS");

    try {
      const manifest = await fetchContent(config, "products/manifest.js");
      manifestSha = manifest.sha;
      products = parseAssignmentFile(decodeBase64(manifest.content), "CLEAR_TONE_PRODUCTS");
    } catch (error) {
      manifestSha = "";
      products = [];
    }

    selectedIndex = 0;
    renderProducts();
    renderList();
    renderForm();
    refreshPreview();
    persistAdminState();
    setStatus("GitHub에서 최신 데이터를 불러왔습니다.");
  }

  async function saveToGithub() {
    applyForm();
    const config = readConfig();
    const sha = dataSha || await getContentSha(config, config.path);
    const payload = {
      message: "Update shortform data",
      content: encodeBase64(formatAssignmentFile("CLEAR_TONE_SHORTFORMS", items)),
      branch: config.branch
    };

    if (sha) payload.sha = sha;

    const result = await githubRequest(
      `https://api.github.com/repos/${config.repo}/contents/${config.path}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      config.token
    );

    dataSha = result.content.sha;
    persistAdminState();
    setStatus("GitHub에 저장했습니다. Pages 반영까지 잠시 걸릴 수 있습니다.");
  }

  async function uploadProductImage() {
    const file = fields.productUpload.files[0];
    if (!file) {
      setStatus("업로드할 제품 이미지를 선택해주세요.");
      return;
    }

    const config = readConfig();
    const fileName = sanitizeFileName(file.name);
    const label = fields.productLabel.value.trim() || fileName.replace(/\.[^.]+$/, "");
    const path = `products/${fileName}`;
    const content = await readFileAsBase64(file);
    const sha = await getContentSha(config, path);

    const payload = {
      message: `Upload product image ${fileName}`,
      content,
      branch: config.branch
    };

    if (sha) payload.sha = sha;

    await githubRequest(
      `https://api.github.com/repos/${config.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      config.token
    );

    products = [
      { name: fileName, label },
      ...products.filter((product) => product.name !== fileName)
    ].sort((a, b) => (a.label || a.name).localeCompare(b.label || b.name));

    await saveProductManifest(config);

    fields.image.value = fileName;
    renderProducts();
    fields.image.value = fileName;
    applyForm();
    fields.productUpload.value = "";
    fields.productLabel.value = "";
    setStatus("제품 이미지를 업로드하고 목록에 추가했습니다.");
  }

  async function saveProductManifest(config) {
    const sha = manifestSha || await getContentSha(config, "products/manifest.js");
    const payload = {
      message: "Update product image manifest",
      content: encodeBase64(formatAssignmentFile("CLEAR_TONE_PRODUCTS", products)),
      branch: config.branch
    };

    if (sha) payload.sha = sha;

    const result = await githubRequest(
      `https://api.github.com/repos/${config.repo}/contents/products/manifest.js`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      },
      config.token
    );

    manifestSha = result.content.sha;
  }

  async function fetchContent(config, path) {
    return githubRequest(
      `https://api.github.com/repos/${config.repo}/contents/${path}?ref=${encodeURIComponent(config.branch)}`,
      { method: "GET" },
      config.token
    );
  }

  async function getContentSha(config, path) {
    try {
      const content = await fetchContent(config, path);
      return content.sha;
    } catch (error) {
      return "";
    }
  }

  function readConfig() {
    const token = fields.token.value.trim();
    if (!token) throw new Error("GitHub Token을 입력해주세요.");
    sessionStorage.setItem("clearToneGithubToken", token);

    return {
      token,
      repo: fields.repo.value.trim(),
      branch: fields.branch.value.trim() || "main",
      path: fields.path.value.trim() || "js/data.js"
    };
  }

  async function githubRequest(url, options, token) {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub 요청 실패: ${response.status} ${detail}`);
    }

    return response.json();
  }

  function parseAssignmentFile(source, variableName) {
    const pattern = new RegExp(`window\\.${variableName}\\s*=\\s*(\\[[\\s\\S]*\\]);?\\s*$`);
    const match = source.match(pattern);
    if (!match) throw new Error(`${variableName} 형식을 읽을 수 없습니다.`);
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      return Function(`"use strict"; return (${match[1]});`)();
    }
  }

  function formatAssignmentFile(variableName, value) {
    return `window.${variableName} = ${JSON.stringify(value, null, 2)};\n`;
  }

  function refreshPreview() {
    const baseHref = new URL("./", window.location.href).href;
    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${baseHref}">
  <link rel="stylesheet" href="./css/styles.css?v=${ASSET_VERSION}">
</head>
<body class="embed-body">
  <main class="embed-page" id="embedPage"></main>
  <script>window.CLEAR_TONE_PRODUCTS = ${JSON.stringify(products)};<\/script>
  <script>window.CLEAR_TONE_SHORTFORMS = ${JSON.stringify(items)};<\/script>
  <script src="./js/embed.js"><\/script>
</body>
</html>`;

    previewFrame.srcdoc = html;
  }

  function setPreviewMode(mode) {
    const isMobile = mode === "mobile";
    previewStage.classList.toggle("is-mobile", isMobile);
    previewStage.classList.toggle("is-desktop", !isMobile);
    buttons.mobile.classList.toggle("is-active", isMobile);
    buttons.desktop.classList.toggle("is-active", !isMobile);
  }

  function createId() {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function sanitizeFileName(value) {
    const cleaned = String(value || "product")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return cleaned || `product-${Date.now()}.png`;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function encodeBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function decodeBase64(value) {
    return decodeURIComponent(escape(atob(String(value || "").replace(/\s/g, ""))));
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  itemList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-index]");
    if (!row) return;
    applyForm();
    selectedIndex = Number(row.dataset.index);
    renderList();
    renderForm();
    persistAdminState();
  });

  fields.image.addEventListener("change", applyForm);
  buttons.apply.addEventListener("click", applyForm);
  buttons.add.addEventListener("click", addItem);
  buttons.delete.addEventListener("click", deleteItem);
  buttons.upload.addEventListener("click", async () => {
    try {
      await uploadProductImage();
    } catch (error) {
      setStatus(error.message);
    }
  });
  buttons.preview.addEventListener("click", () => {
    applyForm();
    setStatus("미리보기를 새로고침했습니다.");
  });
  buttons.desktop.addEventListener("click", () => setPreviewMode("desktop"));
  buttons.mobile.addEventListener("click", () => setPreviewMode("mobile"));

  buttons.load.addEventListener("click", async () => {
    try {
      await loadFromGithub();
    } catch (error) {
      setStatus(error.message);
    }
  });

  buttons.save.addEventListener("click", async () => {
    try {
      await saveToGithub();
    } catch (error) {
      setStatus(error.message);
    }
  });

  renderProducts();
  renderList();
  renderForm();
  refreshPreview();
  persistAdminState();
  if (cachedState) {
    setStatus("최근 편집본을 복원했습니다. GitHub 최신본은 GitHub에서 불러오기로 확인할 수 있습니다.");
  }
}());
