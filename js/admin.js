(function () {
  const fields = {
    token: document.querySelector("#githubToken"),
    repo: document.querySelector("#repoFullName"),
    branch: document.querySelector("#repoBranch"),
    path: document.querySelector("#dataPath"),
    embedUrl: document.querySelector("#embedUrl"),
    image: document.querySelector("#image"),
    brand: document.querySelector("#brand"),
    title: document.querySelector("#title"),
    description: document.querySelector("#description")
  };

  const itemList = document.querySelector("#itemList");
  const statusText = document.querySelector("#statusText");
  const previewFrame = document.querySelector("#previewFrame");
  const buttons = {
    load: document.querySelector("#loadButton"),
    save: document.querySelector("#saveButton"),
    add: document.querySelector("#addButton"),
    delete: document.querySelector("#deleteButton"),
    apply: document.querySelector("#applyButton"),
    preview: document.querySelector("#previewButton")
  };

  let items = cloneItems(window.CLEAR_TONE_SHORTFORMS || []);
  let selectedIndex = 0;
  let contentSha = "";

  fields.token.value = sessionStorage.getItem("clearToneGithubToken") || "";

  function cloneItems(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message) {
    statusText.textContent = message;
  }

  function selectedItem() {
    return items[selectedIndex] || null;
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
      brand: fields.brand.value.trim(),
      title: fields.title.value.trim(),
      description: fields.description.value.trim()
    };
    renderList();
    refreshPreview();
    setStatus("현재 카드가 반영되었습니다. 공개 페이지 반영은 GitHub에 저장해야 합니다.");
  }

  function addItem() {
    applyForm();
    items.push({
      id: createId(),
      embedUrl: "",
      image: "",
      brand: "",
      title: "",
      description: ""
    });
    selectedIndex = items.length - 1;
    renderList();
    renderForm();
    setStatus("새 카드를 추가했습니다.");
  }

  function deleteItem() {
    if (!items.length) return;
    items.splice(selectedIndex, 1);
    selectedIndex = Math.max(0, selectedIndex - 1);
    renderList();
    renderForm();
    refreshPreview();
    setStatus("선택한 카드를 삭제했습니다. 공개 페이지 반영은 GitHub에 저장해야 합니다.");
  }

  async function loadFromGithub() {
    const config = readConfig();
    const data = await githubRequest(
      `https://api.github.com/repos/${config.repo}/contents/${config.path}?ref=${encodeURIComponent(config.branch)}`,
      { method: "GET" },
      config.token
    );

    contentSha = data.sha;
    items = parseDataFile(decodeBase64(data.content));
    selectedIndex = 0;
    renderList();
    renderForm();
    refreshPreview();
    setStatus("GitHub에서 최신 데이터를 불러왔습니다.");
  }

  async function saveToGithub() {
    applyForm();
    const config = readConfig();
    let sha = contentSha;

    if (!sha) {
      try {
        const current = await githubRequest(
          `https://api.github.com/repos/${config.repo}/contents/${config.path}?ref=${encodeURIComponent(config.branch)}`,
          { method: "GET" },
          config.token
        );
        sha = current.sha;
      } catch (error) {
        sha = "";
      }
    }

    const payload = {
      message: "Update shortform data",
      content: encodeBase64(formatDataFile(items)),
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

    contentSha = result.content.sha;
    setStatus("GitHub에 저장했습니다. Pages 반영까지 잠시 걸릴 수 있습니다.");
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

  function parseDataFile(source) {
    const match = source.match(/window\.CLEAR_TONE_SHORTFORMS\s*=\s*(\[[\s\S]*\]);?\s*$/);
    if (!match) throw new Error("js/data.js 형식을 읽을 수 없습니다.");
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      return Function(`"use strict"; return (${match[1]});`)();
    }
  }

  function formatDataFile(value) {
    return `window.CLEAR_TONE_SHORTFORMS = ${JSON.stringify(value, null, 2)};\n`;
  }

  function refreshPreview() {
    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="./css/styles.css">
</head>
<body class="embed-body">
  <main class="embed-page" id="embedPage"></main>
  <script>window.CLEAR_TONE_SHORTFORMS = ${JSON.stringify(items)};<\/script>
  <script src="./js/embed.js"><\/script>
</body>
</html>`;

    previewFrame.srcdoc = html;
  }

  function createId() {
    return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
  });

  buttons.apply.addEventListener("click", applyForm);
  buttons.add.addEventListener("click", addItem);
  buttons.delete.addEventListener("click", deleteItem);
  buttons.preview.addEventListener("click", () => {
    applyForm();
    setStatus("미리보기를 새로고침했습니다.");
  });

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

  renderList();
  renderForm();
  refreshPreview();
}());
