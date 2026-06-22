const API_BASE = "";
const MAX_PROMPT_IMPORT_ITEMS = 300;
const MAX_PROMPT_IMPORT_FILE_BYTES = 512000;
const MAX_INFERENCE_IMAGE_BYTES = 2_500_000;
const MAX_INFERENCE_IMAGE_UPLOAD_BYTES = Math.floor(MAX_INFERENCE_IMAGE_BYTES * 3 / 4);

const TYPE_LABELS = {
  poster: "宣传海报",
  product_shot: "电商产品图",
  social_post: "社媒图",
  banner: "横幅图",
  cover: "活动封面",
};

const els = {
  identityInput: document.getElementById("identityInput"),
  loginBtn: document.getElementById("loginBtn"),
  tabGenerateBtn: document.getElementById("tabGenerateBtn"),
  tabHistoryBtn: document.getElementById("tabHistoryBtn"),
  generateView: document.getElementById("generateView"),
  historyView: document.getElementById("historyView"),
  typeSelect: document.getElementById("typeSelect"),
  industrySelect: document.getElementById("industrySelect"),
  ratioSelect: document.getElementById("ratioSelect"),
  countSelect: document.getElementById("countSelect"),
  titleInput: document.getElementById("titleInput"),
  subtitleInput: document.getElementById("subtitleInput"),
  ctaInput: document.getElementById("ctaInput"),
  styleInput: document.getElementById("styleInput"),
  brandInput: document.getElementById("brandInput"),
  inviteInput: document.getElementById("inviteInput"),
  customPromptInput: document.getElementById("customPromptInput"),
  generateBtn: document.getElementById("generateBtn"),
  activateInviteBtn: document.getElementById("activateInviteBtn"),
  previewBtn: document.getElementById("previewBtn"),
  clearFormBtn: document.getElementById("clearFormBtn"),
  rerenderCurrentBtn: document.getElementById("rerenderCurrentBtn"),
  quotaInfo: document.getElementById("quotaInfo"),
  genError: document.getElementById("genError"),
  resultList: document.getElementById("resultList"),
  historyList: document.getElementById("historyList"),
  userBadge: document.getElementById("userBadge"),
  logoutBtn: document.getElementById("logoutBtn"),
  authSection: document.getElementById("authSection"),
  generatorSection: document.getElementById("generatorSection"),
  jobPanel: document.getElementById("jobPanel"),
  jobStatus: document.getElementById("jobStatus"),
  refreshJobBtn: document.getElementById("refreshJobBtn"),
  jobLoading: document.getElementById("jobLoading"),
  templateHint: document.getElementById("templateHint"),
  promptPreviewWrap: document.getElementById("promptPreviewWrap"),
  promptPreview: document.getElementById("promptPreview"),
  promptImportFile: document.getElementById("promptImportFile"),
  promptImportInput: document.getElementById("promptImportInput"),
  promptImportPreviewBtn: document.getElementById("promptImportPreviewBtn"),
  promptImportCommitBtn: document.getElementById("promptImportCommitBtn"),
  promptImportClearBtn: document.getElementById("promptImportClearBtn"),
  promptImportStatus: document.getElementById("promptImportStatus"),
  promptImportSummary: document.getElementById("promptImportSummary"),
  promptImportList: document.getElementById("promptImportList"),
  libraryTypeFilter: document.getElementById("libraryTypeFilter"),
  libraryIndustryFilter: document.getElementById("libraryIndustryFilter"),
  refreshLibraryBtn: document.getElementById("refreshLibraryBtn"),
  promptLibraryList: document.getElementById("promptLibraryList"),
  referenceImageInput: document.getElementById("referenceImageInput"),
  referenceImagePreview: document.getElementById("referenceImagePreview"),
  referenceImageThumb: document.getElementById("referenceImageThumb"),
  reversePromptBtn: document.getElementById("reversePromptBtn"),
  reversePromptWrap: document.getElementById("reversePromptWrap"),
  reversePromptResult: document.getElementById("reversePromptResult"),
  applyReversePromptBtn: document.getElementById("applyReversePromptBtn"),
  statusText: document.getElementById("statusText"),
  toastContainer: document.getElementById("toastContainer"),
  resultSkeleton: document.getElementById("resultSkeleton"),
};

const state = {
  token: localStorage.getItem("token"),
  user: null,
  currentJobId: null,
  currentJob: null,
  pollingId: null,
  templateState: null,
  importPreviewItems: [],
  referenceImageDataUrl: "",
  referenceImageMime: "",
};

function isAuthed() {
  return Boolean(state.token);
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

function showError(msg, shouldToast = false) {
  els.genError.textContent = msg || "";
  if (shouldToast && msg) {
    showToast(msg, { type: "error" });
  }
}

function setStatusBar(msg) {
  if (!els.statusText) return;
  els.statusText.textContent = msg || "就绪";
}

function setButtonBusy(button, text = "") {
  if (!button) return () => {};
  const isAlreadyBusy = button.classList.contains("is-busy");
  if (!isAlreadyBusy) {
    button.dataset.__originText = button.textContent;
  }
  button.disabled = true;
  button.classList.add("is-busy");
  if (text) button.textContent = text;

  return () => {
    if (button.dataset.__originText !== undefined) {
      button.textContent = button.dataset.__originText;
      delete button.dataset.__originText;
    }
    button.disabled = false;
    button.classList.remove("is-busy");
  };
}

async function withButtonBusy(button, text, fn) {
  const done = setButtonBusy(button, text);
  try {
    return await fn();
  } finally {
    done();
  }
}

function showToast(message, { type = "info", duration = 2600 } = {}) {
  if (!els.toastContainer || !message) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  els.toastContainer.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-6px)";
    toast.style.transition = "opacity 0.16s ease, transform 0.16s ease";
  }, Math.max(120, duration - 220));

  window.setTimeout(() => {
    toast.remove();
  }, duration);
}

function toggleResultSkeleton(visible) {
  if (!els.resultSkeleton) return;
  els.resultSkeleton.classList.toggle("hidden", !visible);
}

function setQuotaLabel(quota) {
  els.quotaInfo.textContent = `剩余额度：${quota}`;
}

function setUserLabel() {
  if (!state.user) return;
  els.userBadge.textContent = `当前用户：${state.user.emailOrPhone || state.user.id}`;
}

function setWorkspaceTab(mode = "generate") {
  if (!els.generateView || !els.historyView) return;
  const isGenerate = mode !== "history";
  els.generateView.classList.toggle("hidden", !isGenerate);
  els.historyView.classList.toggle("hidden", isGenerate);

  if (els.tabGenerateBtn) {
    els.tabGenerateBtn.classList.toggle("is-active", isGenerate);
  }
  if (els.tabHistoryBtn) {
    els.tabHistoryBtn.classList.toggle("is-active", !isGenerate);
  }
}

function setAuthUI(loggedIn) {
  if (loggedIn) {
    els.authSection.classList.add("hidden");
    els.generatorSection.classList.remove("hidden");
    els.logoutBtn.classList.remove("hidden");
    setUserLabel();
    setStatusBar(`欢迎 ${state.user?.emailOrPhone || "用户"} 使用`);
    setWorkspaceTab("generate");
  } else {
    els.authSection.classList.remove("hidden");
    els.generatorSection.classList.add("hidden");
    els.logoutBtn.classList.add("hidden");
    els.userBadge.textContent = "未登录";
    setQuotaLabel("未知");
    clearJobs();
    els.resultList.innerHTML = "";
    els.historyList.innerHTML = "";
    els.jobPanel.classList.add("hidden");
    els.jobLoading.classList.add("hidden");
    els.rerenderCurrentBtn.classList.add("hidden");
    els.promptImportInput.value = "";
    els.promptImportFile.value = "";
    els.promptImportStatus.textContent = "";
    els.promptImportSummary.textContent = "";
    els.promptImportList.innerHTML = "";
    els.promptLibraryList.innerHTML = "";
    if (els.referenceImageInput) {
      els.referenceImageInput.value = "";
    }
    state.referenceImageDataUrl = "";
    state.referenceImageMime = "";
    if (els.referenceImageThumb) {
      els.referenceImageThumb.src = "";
      els.referenceImageThumb.parentElement?.classList?.add("hidden");
    }
    if (els.reversePromptWrap) {
      els.reversePromptWrap.classList.add("hidden");
    }
    if (els.reversePromptResult) {
      els.reversePromptResult.textContent = "";
    }
    setStatusBar("未登录");
  }
}

function clearJobs() {
  els.resultList.innerHTML = "";
}

function buildPayloadFromInputs(overrides = {}) {
  const payload = {
    type: overrides.type || els.typeSelect.value,
    industry: overrides.industry || els.industrySelect.value,
    ratio: overrides.ratio || els.ratioSelect.value,
    count: Number(overrides.count || els.countSelect.value || 3),
    title: typeof overrides.title === "string" ? overrides.title : els.titleInput.value.trim(),
    subtitle: typeof overrides.subtitle === "string" ? overrides.subtitle : els.subtitleInput.value.trim(),
    cta: typeof overrides.cta === "string" ? overrides.cta : els.ctaInput.value.trim(),
    colorStyle: typeof overrides.colorStyle === "string" ? overrides.colorStyle : els.styleInput.value.trim(),
    brandTone: typeof overrides.brandTone === "string" ? overrides.brandTone : els.brandInput.value.trim(),
    customPrompt: typeof overrides.customPrompt === "string" ? overrides.customPrompt : els.customPromptInput.value.trim(),
  };

  return payload;
}

async function callApi(path, init = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers || {}),
    },
  });

  const data = await resp.json().catch(() => ({ ok: false, error: "网络返回非 JSON" }));
  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || `请求失败 ${resp.status}`);
  }
  return data;
}

function updateRatioOptions(allowedSizes = ["1:1", "4:5", "16:9", "9:16"]) {
  const current = els.ratioSelect.value;
  els.ratioSelect.innerHTML = "";
  allowedSizes.forEach((size) => {
    const opt = document.createElement("option");
    opt.value = size;
    opt.textContent = size;
    els.ratioSelect.appendChild(opt);
  });
  if (allowedSizes.includes(current)) {
    els.ratioSelect.value = current;
  }
  els.templateHint.textContent = `推荐比例：${allowedSizes.join(" / ")}`;
}

async function syncTemplateHints() {
  setStatusBar("正在刷新模板配置...");
  try {
    const type = els.typeSelect.value;
    const industry = els.industrySelect.value;
    const data = await callApi(`/api/templates?type=${encodeURIComponent(type)}&industry=${encodeURIComponent(industry)}`);
    const item = data.templates?.[0] || null;
    state.templateState = item;
    updateRatioOptions(item?.allowedSizes || ["1:1", "4:5", "16:9", "9:16"]);
    if (!els.ratioSelect.value) els.ratioSelect.value = els.ratioSelect.querySelector("option")?.value || "1:1";
    if (type === "product_shot" && els.ratioSelect.value === "9:16") {
      els.ratioSelect.value = "1:1";
    }
  } catch {
    updateRatioOptions(["1:1", "4:5", "16:9", "9:16"]);
  } finally {
    setStatusBar("系统就绪");
  }
}

function renderHistory(items) {
  els.historyList.innerHTML = "";
  if (!items.length) {
    els.historyList.innerHTML = "<div class='history-item'>暂无历史记录</div>";
    return;
  }
  items.forEach((item) => {
    const div = document.createElement("div");
    div.className = "history-item";
    const created = new Date(item.createdAt).toLocaleString();
    const statusClass = item.status === "done" ? "tag-ok" : item.status === "failed" ? "tag-error" : "tag-info";
    const titlePreview = item.inputPayload?.title || "（未填写主标题）";
    const assetHtml = item.previewImage
      ? `<img src="${item.previewImage}" alt="preview" class="small-image"/>`
      : "<div class='small-image placeholder'>No preview</div>";

    div.innerHTML = `
      <div class="history-header">
        <strong>${TYPE_LABELS[item.type] || item.type}</strong>
        <span class="status-tag ${statusClass}">${item.status}</span>
      </div>
      <div class="muted">${item.industry} · ${item.ratio} · 张数 ${item.inputPayload?.count || 0}</div>
      <div>${titlePreview}</div>
      <div>${created}</div>
      ${assetHtml}
      <div class="row">
        <button class="ghost historyOpen" data-job="${item.id}">查看任务</button>
        <button class="ghost historyReroll" data-job="${item.id}">同参数重画</button>
      </div>
    `;

    div.querySelector(".historyOpen").addEventListener("click", async () => {
      state.currentJobId = item.id;
      await refreshJob();
      await fetchAssets(item.id);
    });

    div.querySelector(".historyReroll").addEventListener("click", async () => {
      await rerollJob(item.id);
    });

    els.historyList.appendChild(div);
  });
}

function renderAssets(items) {
  toggleResultSkeleton(false);
  if (!items.length) {
    if (state.currentJob?.status === "processing" || state.currentJob?.status === "queued") {
      els.resultList.innerHTML = "<div class='card-item'>生成中，正在生成图片...</div>";
    } else {
      els.resultList.innerHTML = "<div class='card-item'>无图片，任务尚未产出。</div>";
    }
    return;
  }
  els.resultList.innerHTML = "";
  items.forEach((it) => {
    const card = document.createElement("div");
    card.className = "card-item";
    card.innerHTML = `
      <a href="${it.url}" target="_blank" rel="noreferrer">打开原图</a>
      <img src="${it.url}" alt="result" />
      <div>尺寸：${it.width}x${it.height}</div>
      <div>${new Date(it.createdAt).toLocaleString()}</div>
      <a href="${it.url}" download class="small-btn">下载</a>
    `;
    els.resultList.appendChild(card);
  });
}

async function fetchAssets(jobId) {
  const data = await callApi(`/api/jobs/${jobId}/assets`);
  renderAssets(data.assets || []);
}

async function fetchPromptPreview() {
  return withButtonBusy(els.previewBtn, "预览中...", async () => {
    const payload = buildPayloadFromInputs({
      count: Number(els.countSelect.value || 3),
    });
    const data = await callApi("/api/prompt-preview", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    els.promptPreview.textContent = data.finalPrompt;
    els.promptPreviewWrap.classList.remove("hidden");
    showError("");
    setStatusBar("Prompt 已生成预览");
  }).catch((e) => {
    showError(e.message, true);
    throw e;
  });
}

function isImageTooLarge(dataUrl) {
  if (!dataUrl) return false;
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4) > MAX_INFERENCE_IMAGE_BYTES;
}

function showReferenceImagePreview() {
  if (!els.referenceImageThumb || !els.referenceImagePreview) return;
  if (!state.referenceImageDataUrl) {
    els.referenceImageThumb.src = "";
    els.referenceImagePreview.classList.add("hidden");
    return;
  }
  els.referenceImageThumb.src = state.referenceImageDataUrl;
  els.referenceImagePreview.classList.remove("hidden");
}

async function handleReferenceImageFile(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;

  if (!/^image\//.test(file.type || "")) {
    showError("请上传图片文件。");
    return;
  }
  const maxUploadMb = (MAX_INFERENCE_IMAGE_UPLOAD_BYTES / 1024 / 1024).toFixed(1);
  if (file.size > MAX_INFERENCE_IMAGE_UPLOAD_BYTES) {
    showError(`上传图片过大，建议小于 ${maxUploadMb}MB（用于反推前请控制原图大小）`);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    state.referenceImageDataUrl = String(reader.result || "");
    state.referenceImageMime = file.type || "image/jpeg";
    showReferenceImagePreview();
    showError("");
    if (els.reversePromptWrap) {
      els.reversePromptWrap.classList.add("hidden");
      if (els.reversePromptResult) {
        els.reversePromptResult.textContent = "";
      }
    }
  };
  reader.onerror = () => {
    showError("图片读取失败，请重试。");
  };
  reader.readAsDataURL(file);
}

async function reversePromptFromImage() {
  if (!state.referenceImageDataUrl) {
    showError("请先上传参考图。");
    return;
  }
  if (isImageTooLarge(state.referenceImageDataUrl)) {
    showError("参考图体积过大，请重新上传小于 2.5MB 的图片。");
    return;
  }

  return withButtonBusy(els.reversePromptBtn, "反推中...", async () => {
    const commaIndex = state.referenceImageDataUrl.indexOf(",");
    const base64 = commaIndex >= 0 ? state.referenceImageDataUrl.slice(commaIndex + 1) : state.referenceImageDataUrl;
    const data = await callApi("/api/reverse-prompt", {
      method: "POST",
      body: JSON.stringify({
        imageBase64: base64,
        imageMime: state.referenceImageMime,
      }),
    });
    if (els.reversePromptResult) {
      els.reversePromptResult.textContent = data.inferredPrompt || "";
    }
    if (els.reversePromptWrap) {
      els.reversePromptWrap.classList.remove("hidden");
    }
    showError("");
    setStatusBar("反推提示词已生成");
    showToast("反推完成，可点击应用到自定义提示词", { type: "success" });
  }).catch((e) => {
    showError(e.message, true);
    if (els.reversePromptWrap) {
      els.reversePromptWrap.classList.add("hidden");
    }
    throw e;
  });
}

function applyReversePromptToCustom() {
  if (!els.reversePromptResult || !els.customPromptInput) return;
  const hint = els.reversePromptResult.textContent.trim();
  if (!hint) {
    showError("先生成反推提示词。");
    return;
  }
  const current = els.customPromptInput.value.trim();
  els.customPromptInput.value = current ? `${current}\n\n${hint}` : hint;
  showToast("已应用到自定义提示词", { type: "success" });
  showError("");
}

function showImportMessage(msg) {
  els.promptImportStatus.textContent = msg || "";
}

function collectImportEntries() {
  const raw = els.promptImportInput.value.trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length > MAX_PROMPT_IMPORT_ITEMS) {
        showImportMessage(`导入项超过限制（最多 ${MAX_PROMPT_IMPORT_ITEMS} 条）`);
        return [];
      }
      return parsed.filter((item) => {
        if (typeof item === "string") return Boolean(item.trim());
        if (!item || typeof item !== "object") return false;
        return Boolean(item.prompt || item.text || item.content);
      });
    }
  } catch {
    // ignore JSON parse error and fallback to plain text mode
  }

  const blocks = [];
  const lines = raw.split(/\r?\n/);

  for (const row of lines) {
    const line = row.trim();
    if (!line) continue;
    if (/^#{1,6}\s+/.test(line) || line === "---") {
      continue;
    }
    const cleaned = line.replace(/^[\-\*\+]\s*/, "").replace(/^\d+[.)、]\s*/, "");
    const compact = cleaned.replace(/\s+/g, " ").trim();
    if (compact) {
      blocks.push({ prompt: compact });
      if (blocks.length > MAX_PROMPT_IMPORT_ITEMS) {
        showImportMessage(`已超过导入条数上限（${MAX_PROMPT_IMPORT_ITEMS}）`);
        return blocks.slice(0, MAX_PROMPT_IMPORT_ITEMS);
      }
    }
  }

  return blocks;
}

function renderImportPreview(items) {
  if (!items.length) {
    els.promptImportList.innerHTML = "<div class='prompt-list-item'>暂无可预览内容</div>";
    return;
  }
  els.promptImportList.innerHTML = "";
  items.forEach((item) => {
    const safePrompt = String(item.prompt || item.content || item.text || "").slice(0, 150);
    const div = document.createElement("div");
    div.className = "prompt-list-item";
    const predictedType = item.classify?.type?.predicted || item.classification?.type?.predicted || "unknown";
    const predictedIndustry = item.classify?.industry?.predicted || item.classification?.industry?.predicted || "unknown";
    const typeConfidence = item.classify?.type?.confidence ?? item.classification?.type?.confidence ?? 0;
    const industryConfidence = item.classify?.industry?.confidence ?? item.classification?.industry?.confidence ?? 0;
    const top = item.classify?.type?.matched || item.classification?.type?.matched || [];

    const tags = [typeConfidence > 0 ? `类型 ${TYPE_LABELS[predictedType] || predictedType} (${(typeConfidence * 100).toFixed(0)}%)` : "类型 待识别"];
    tags.push(industryConfidence > 0 ? `行业 ${predictedIndustry} (${(industryConfidence * 100).toFixed(0)}%)` : "行业 待识别");
    if (top.length) {
      tags.push(`触发词 ${top.slice(0, 3).join(" / ")}`);
    }

    div.innerHTML = `
      <strong>${item.name || "未命名提示词"}</strong>
      <div class="meta">${tags.map((tag) => `<span class="prompt-tag">${tag}</span>`).join("")}</div>
      <div class="muted">${safePrompt}</div>
    `;
    els.promptImportList.appendChild(div);
  });
}

function renderImportSummary(items) {
  const countByType = new Map();
  const countByIndustry = new Map();
  items.forEach((item) => {
    const t = item.classify?.type?.predicted || item.classification?.type?.predicted || "unknown";
    const i = item.classify?.industry?.predicted || item.classification?.industry?.predicted || "unknown";
    countByType.set(t, (countByType.get(t) || 0) + 1);
    countByIndustry.set(i, (countByIndustry.get(i) || 0) + 1);
  });
  const tText = Array.from(countByType.entries())
    .map(([name, c]) => `${TYPE_LABELS[name] || name}(${c})`)
    .join("、");
  const iText = Array.from(countByIndustry.entries())
    .map(([name, c]) => `${name}(${c})`)
    .join("、");
  els.promptImportSummary.textContent = `共 ${items.length} 条，类型分布：${tText || "无"}；行业分布：${iText || "无"}`;
}

function renderPromptLibrary(items) {
  if (!items.length) {
    els.promptLibraryList.innerHTML = "<div class='prompt-list-item'>当前暂无提示词</div>";
    return;
  }
  els.promptLibraryList.innerHTML = "";
  items.forEach((item) => {
    const safePrompt = String(item.prompt || "").slice(0, 150);
    const safeName = String(item.name || "未命名提示词").slice(0, 60);
    const div = document.createElement("div");
    div.className = "prompt-list-item";
    const tags = [];
    const predicted = item.predicted || {};
    const typeConf = Number(predicted.typeConfidence || 0);
    const industryConf = Number(predicted.industryConfidence || 0);
    tags.push(`类型 ${TYPE_LABELS[predicted.type] || predicted.type || "待识别"}`);
    tags.push(`行业 ${predicted.industry || "待识别"}`);
    tags.push(`类型置信度 ${(typeConf * 100).toFixed(0)}%`);
    tags.push(`行业置信度 ${(industryConf * 100).toFixed(0)}%`);

    div.innerHTML = `
      <strong>${safeName}</strong>
      <div class="meta">${tags.map((tag) => `<span class="prompt-tag">${tag}</span>`).join("")}</div>
      <div class="muted">${safePrompt}</div>
    `;
    els.promptLibraryList.appendChild(div);
  });
}

async function refreshPromptLibrary(withStatus = false) {
  if (!isAuthed()) return;
  if (withStatus) {
    setStatusBar("刷新提示词库...");
  }
  try {
    const type = els.libraryTypeFilter.value;
    const industry = els.libraryIndustryFilter.value;
    const qs = [];
    if (type) qs.push(`type=${encodeURIComponent(type)}`);
    if (industry) qs.push(`industry=${encodeURIComponent(industry)}`);
    const query = qs.length ? `?${qs.join("&")}` : "";
    const data = await callApi(`/api/prompt-library${query}`);
    renderPromptLibrary(data.items || []);
    showImportMessage(`提示词库加载完成：${data.total || 0}条`);
    if (withStatus) {
      setStatusBar("提示词库已刷新");
      showToast("提示词库刷新完成", { type: "success" });
    }
  } catch (e) {
    showImportMessage(e.message);
    if (withStatus) {
      showError(e.message, true);
    }
  }
}

function clearTextInputs() {
  els.titleInput.value = "";
  els.subtitleInput.value = "";
  els.ctaInput.value = "";
  els.styleInput.value = "";
  els.brandInput.value = "";
  els.customPromptInput.value = "";
  els.promptPreviewWrap.classList.add("hidden");
  els.promptPreview.textContent = "";
}

async function previewPromptImport() {
  showError("");
  showImportMessage("");
  const entries = collectImportEntries();
  if (!entries.length) {
    showImportMessage("请输入可解析的提示词内容。");
    return;
  }
  return withButtonBusy(els.promptImportPreviewBtn, "分类中...", async () => {
    const data = await callApi("/api/prompt-library/import", {
      method: "POST",
      body: JSON.stringify({ prompts: entries, dryRun: true }),
    });
    const items = data.items || [];
    state.importPreviewItems = items;
    renderImportPreview(items);
    renderImportSummary(items);
    showImportMessage(`预览完成：${data.total || items.length} 条`);
    showToast(`预览完成，共 ${items.length} 条`, { type: "success" });
    setStatusBar("预览分类完成");
  }).catch((e) => {
    showImportMessage(e.message);
    showError(e.message, true);
    throw e;
  });
}

async function commitPromptImport() {
  showError("");
  showImportMessage("");
  const entries = collectImportEntries();
  if (!entries.length) {
    showImportMessage("请输入可解析的提示词内容。");
    return;
  }
  return withButtonBusy(els.promptImportCommitBtn, "导入中...", async () => {
    const data = await callApi("/api/prompt-library/import", {
      method: "POST",
      body: JSON.stringify({ prompts: entries, dryRun: false }),
    });
    showImportMessage(`导入成功：${data.imported || 0} 条`);
    state.importPreviewItems = [];
    showToast(`导入成功 ${data.imported || 0} 条`, { type: "success" });
    await refreshPromptLibrary(true);
    setStatusBar("导入完成");
  }).catch((e) => {
    showImportMessage(e.message);
    showError(e.message, true);
    throw e;
  });
}

function clearPromptImport() {
  els.promptImportInput.value = "";
  els.promptImportFile.value = "";
  state.importPreviewItems = [];
  els.promptImportList.innerHTML = "";
  els.promptImportSummary.textContent = "";
  showImportMessage("");
}

function handlePromptImportFile(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  if (file.size > MAX_PROMPT_IMPORT_FILE_BYTES) {
    showImportMessage(`文件过大，请选择小于 ${Math.round(MAX_PROMPT_IMPORT_FILE_BYTES / 1024)}KB 的 JSON/TXT 文件。`);
    ev.target.value = "";
    return;
  }
  if (file.type && !/text\/|json/.test(file.type)) {
    showImportMessage("请上传 JSON 或文本文档。");
    ev.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "");
    if (text) {
      els.promptImportInput.value = text;
      showImportMessage("已读取文件内容到输入框，可先预览分类。");
    }
  };
  reader.onerror = () => {
    showImportMessage("文件读取失败，请重试。");
  };
  reader.readAsText(file);
}

async function refreshJob(options = {}) {
  if (!state.currentJobId) return;
  const { showLoading = false } = options;
  const data = await callApi(`/api/jobs/${state.currentJobId}`);
  const job = data.job;
  state.currentJob = job;

  els.jobStatus.textContent = `任务：${job.id}，状态：${job.status}`;
  els.jobPanel.classList.remove("hidden");
  if (showLoading) setStatusBar(`任务 ${job.id} 状态刷新中`);

  if (job.status === "processing" || job.status === "queued") {
    els.jobLoading.classList.remove("hidden");
    els.rerenderCurrentBtn.classList.add("hidden");
    toggleResultSkeleton(true);
    if (!state.pollingId) {
      state.pollingId = window.setInterval(async () => {
        try {
          await refreshJob();
        } catch {
          window.clearInterval(state.pollingId);
          state.pollingId = null;
        }
      }, 2500);
    }
    return;
  }

  if (state.pollingId) {
    window.clearInterval(state.pollingId);
    state.pollingId = null;
  }
  els.jobLoading.classList.add("hidden");
  els.rerenderCurrentBtn.classList.remove("hidden");
  toggleResultSkeleton(false);

  if (job.status === "done" || job.status === "partial") {
    await fetchAssets(job.id);
    await refreshHistory();
    showError("");
    setStatusBar("任务已完成");
  } else if (job.status === "failed") {
    renderAssets([]);
    showError(`生成失败：${job.error || "请重试"}`);
    setStatusBar("任务失败");
  }
}

async function refreshHistory() {
  if (!isAuthed()) return;
  const data = await callApi("/api/me/history");
  renderHistory(data.history || []);
}

async function doLogin() {
  const identity = els.identityInput.value.trim();
  if (!identity) {
    showError("请输入手机号/邮箱");
    return;
  }
  return withButtonBusy(els.loginBtn, "登录中...", async () => {
    const data = await callApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identity }),
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("token", data.token);
    setAuthUI(true);
    setUserLabel();
    setQuotaLabel(state.user.quotaLeft);
    showError("");
    await syncTemplateHints();
    await refreshPromptLibrary(true);
    await refreshHistory();
    setStatusBar(`已登录：${state.user.emailOrPhone || state.user.id}`);
    showToast("登录成功", { type: "success" });
  }).catch((e) => {
    showError(e.message, true);
    throw e;
  });
}

async function activateInvite() {
  const code = els.inviteInput.value.trim();
  if (!code) {
    showError("请输入邀请码");
    return;
  }
  return withButtonBusy(els.activateInviteBtn, "激活中...", async () => {
    const data = await callApi("/api/invite/activate", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    if (state.user) state.user.quotaLeft = data.quotaLeft;
    setQuotaLabel(data.quotaLeft);
    showError("邀请码激活成功");
    await refreshHistory();
    showToast("邀请码激活成功", { type: "success" });
    setStatusBar("邀请码已生效");
  }).catch((e) => {
    showError(e.message, true);
    throw e;
  });
}

async function doGenerate() {
  showError("");
  if (!els.titleInput.value.trim() && !els.subtitleInput.value.trim()) {
    showError("主标题与副标题至少填写一项");
    return;
  }

  const payload = buildPayloadFromInputs();
  clearJobs();
  return withButtonBusy(els.generateBtn, "生成中...", async () => {
    const data = await callApi("/api/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.currentJobId = data.jobId;
    if (state.user) state.user.quotaLeft = data.quotaLeft;
    setQuotaLabel(data.quotaLeft);
    els.jobPanel.classList.remove("hidden");
    els.jobStatus.textContent = `任务：${data.jobId}，状态：${data.status}`;
    els.jobLoading.classList.remove("hidden");
    toggleResultSkeleton(true);
    setStatusBar(`任务 ${data.jobId} 已创建`);
    showToast("任务已提交，正在生成...", { type: "success" });
    setTimeout(() => {
      refreshJob().catch(() => {});
    }, 500);
  }).catch((e) => {
    showError(e.message, true);
    showToast(e.message, { type: "error" });
    els.jobLoading.classList.add("hidden");
    toggleResultSkeleton(false);
    throw e;
  });
}

async function rerollCurrent() {
  if (!state.currentJob) return;
  await rerollJob(state.currentJobId);
}

async function rerollJob(jobId) {
  return withButtonBusy(els.rerenderCurrentBtn, "重画中...", async () => {
    const data = await callApi(`/api/jobs/${jobId}/reroll`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.currentJobId = data.jobId;
    if (state.user) state.user.quotaLeft = data.quotaLeft;
    setQuotaLabel(data.quotaLeft);
    clearJobs();
    setTimeout(() => {
      refreshJob().catch(() => {});
    }, 500);
    await refreshHistory();
    els.jobPanel.classList.remove("hidden");
    showError("已发起重画任务");
    showToast("已发起重画任务", { type: "success" });
  }).catch((e) => {
    showError(e.message, true);
    throw e;
  });
}

function logout() {
  if (state.pollingId) {
    window.clearInterval(state.pollingId);
    state.pollingId = null;
  }
  state.token = null;
  state.user = null;
  state.currentJobId = null;
  state.currentJob = null;
  localStorage.removeItem("token");
  setAuthUI(false);
  setStatusBar("已退出登录");
}

async function bootstrap() {
  setStatusBar("初始化应用...");
  if (!els.countSelect.value) els.countSelect.value = "3";
  await syncTemplateHints();

  if (isAuthed()) {
    try {
      const profile = await callApi("/api/me/profile");
      state.user = profile.user;
      setAuthUI(true);
      setQuotaLabel(state.user.quotaLeft || 0);
      await refreshPromptLibrary();
      await refreshHistory();
      setStatusBar("系统就绪");
    } catch {
      logout();
    }
  } else {
    setAuthUI(false);
    clearJobs();
    setStatusBar("未登录，未接入服务");
  }
}

els.typeSelect.addEventListener("change", syncTemplateHints);
els.industrySelect.addEventListener("change", syncTemplateHints);
els.ratioSelect.addEventListener("change", () => {
  if (state.templateState?.allowedSizes?.length && !state.templateState.allowedSizes.includes(els.ratioSelect.value)) {
    const first = state.templateState.allowedSizes[0];
    if (first) els.ratioSelect.value = first;
  }
});
els.typeSelect.addEventListener("change", () => {
  if (els.typeSelect.value === "product_shot") {
    els.ratioSelect.value = "1:1";
  }
});
els.loginBtn.addEventListener("click", doLogin);
if (els.tabGenerateBtn) {
  els.tabGenerateBtn.addEventListener("click", () => setWorkspaceTab("generate"));
}
if (els.tabHistoryBtn) {
  els.tabHistoryBtn.addEventListener("click", () => setWorkspaceTab("history"));
}
if (els.referenceImageInput) {
  els.referenceImageInput.addEventListener("change", handleReferenceImageFile);
}
if (els.reversePromptBtn) {
  els.reversePromptBtn.addEventListener("click", reversePromptFromImage);
}
if (els.applyReversePromptBtn) {
  els.applyReversePromptBtn.addEventListener("click", applyReversePromptToCustom);
}
els.activateInviteBtn.addEventListener("click", activateInvite);
els.previewBtn.addEventListener("click", fetchPromptPreview);
els.clearFormBtn.addEventListener("click", clearTextInputs);
els.generateBtn.addEventListener("click", doGenerate);
els.refreshJobBtn.addEventListener("click", () => refreshJob({ showLoading: true }));
els.rerenderCurrentBtn.addEventListener("click", rerollCurrent);
els.promptImportFile.addEventListener("change", handlePromptImportFile);
els.promptImportPreviewBtn.addEventListener("click", previewPromptImport);
els.promptImportCommitBtn.addEventListener("click", commitPromptImport);
els.promptImportClearBtn.addEventListener("click", clearPromptImport);
els.refreshLibraryBtn.addEventListener("click", () => refreshPromptLibrary(true));
els.libraryTypeFilter.addEventListener("change", refreshPromptLibrary);
els.libraryIndustryFilter.addEventListener("change", refreshPromptLibrary);

bootstrap();
