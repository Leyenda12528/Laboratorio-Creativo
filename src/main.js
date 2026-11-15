import { missions } from "./missions.js";
import { loadWorkspace, saveWorkspace } from "./services/storage.js";

const starter = () => ({
  id: crypto.randomUUID(), name: "Mi primera creación", html: "", css: "", js: "", missionId: missions[0].id, updatedAt: new Date().toISOString(),
});

function readStore() {
  const value = loadWorkspace();
  if (value?.version === 1 && Array.isArray(value.projects)) {
    const projects = value.projects.filter((p) => p && typeof p.id === "string").map(normalizeProject);
    return { version: 1, projects: projects.length ? projects : [starter()], activeProjectId: value.activeProjectId, completedMissions: Array.isArray(value.completedMissions) ? value.completedMissions.filter((id) => missions.some((m) => m.id === id)) : [] };
  }
  return { version: 1, projects: [starter()], activeProjectId: null, completedMissions: [] };
}

function normalizeProject(project) {
  return {
    id: project.id,
    name: typeof project.name === "string" ? project.name.slice(0, 60) : "Proyecto sin título",
    html: typeof project.html === "string" ? project.html : "",
    css: typeof project.css === "string" ? project.css : "",
    js: typeof project.js === "string" ? project.js : "",
    missionId: missions.some((m) => m.id === project.missionId) ? project.missionId : missions[0].id,
    updatedAt: typeof project.updatedAt === "string" ? project.updatedAt : new Date().toISOString(),
  };
}

const store = readStore();
store.activeProjectId = store.projects.some((p) => p.id === store.activeProjectId) ? store.activeProjectId : store.projects[0].id;
let activeEditor = "html";
let previewTimer;
let toastTimer;
let currentView = "editor";

const $ = (selector) => document.querySelector(selector);
const editors = { html: $("#code-html"), css: $("#code-css"), js: $("#code-js") };
const previewHost = $("#preview").parentElement;
const activeProject = () => store.projects.find((p) => p.id === store.activeProjectId);

function persist() {
  if (saveWorkspace(store)) {
    const indicator = $("#save-indicator");
    indicator.innerHTML = '<span class="status-dot"></span> Guardado';
  } else {
    const indicator = $("#save-indicator");
    indicator.innerHTML = '<span class="status-dot warning-dot"></span> No se pudo guardar';
    showToast("El almacenamiento del navegador está lleno. Descarga un respaldo.");
  }
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

function setSavePending() {
  $("#save-indicator").innerHTML = '<span class="status-dot pending-dot"></span> Guardando…';
  clearTimeout(window.saveTimer);
  window.saveTimer = setTimeout(persist, 180);
}

function renderProject() {
  const project = activeProject();
  if (!project) return;
  $("#project-name").value = project.name;
  Object.entries(editors).forEach(([key, editor]) => { editor.value = project[key]; });
  renderSelectedMission();
  updatePreview(true);
}

function renderSelectedMission() {
  const project = activeProject();
  const mission = missions.find((item) => item.id === project?.missionId) || missions[0];
  $("#selected-mission-title").textContent = mission.title;
  $("#selected-mission-description").textContent = mission.description;
  $("#selected-prompt").textContent = mission.prompt;
}

function previewDocument(project) {
  const html = project.html || '<main><div class="welcome"><span>✦</span><h1>Tu idea empieza aquí</h1><p>Pega tu HTML para ver tu creación.</p></div></main>';
  const css = `*{box-sizing:border-box}body{margin:0;padding:24px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#243044;background:#fff}img{max-width:100%}button{font:inherit;cursor:pointer}${project.css}`;
  const js = project.js ? `<script>${project.js.replace(/<\/script/gi, "<\\/script")}\n<\/script>` : "";
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css.replace(/<\/style/gi, "<\\/style")}</style></head><body>${html}${js}</body></html>`;
}

function updatePreview(forceReload = false) {
  const frame = $("#preview");
  const documentHtml = previewDocument(activeProject());
  if (forceReload) {
    const replacement = frame.cloneNode(false);
    replacement.srcdoc = documentHtml;
    frame.replaceWith(replacement);
    return;
  }
  frame.srcdoc = documentHtml;
}

function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, 260);
}

function renderProgress() {
  const completed = store.completedMissions.length;
  $("#progress-number").textContent = completed;
  $("#progress-fill").style.width = `${Math.min(100, completed / missions.length * 100)}%`;
  $("#progress-caption").textContent = completed ? `¡Buen trabajo! Has completado ${completed} de ${missions.length} misiones disponibles.` : "Tu primera misión te espera. ¡Anímate a crear!";
}

function renderMissions() {
  $("#mission-count").textContent = missions.length;
  $("#mission-grid").innerHTML = missions.map((mission, index) => {
    const done = store.completedMissions.includes(mission.id);
    return `<article class="mission-card panel"><div class="mission-card-top"><span class="mission-emoji">${mission.emoji}</span><span class="mission-number">MISIÓN 0${index + 1}</span></div><span class="mission-category">${mission.category}</span><h2>${mission.title}</h2><p>${mission.description}</p><div class="mission-card-meta"><span>${mission.level}</span><span>${done ? "✓ Completada" : "En tu propio ritmo"}</span></div><div class="mission-card-actions"><button class="button button-primary choose-mission" data-mission="${mission.id}">Usar esta misión</button><button class="button ${done ? "button-done" : "button-small"} complete-mission" data-mission="${mission.id}" aria-label="${done ? "Marcar como pendiente" : "Marcar como completada"}">${done ? "✓" : "○"}</button></div></article>`;
  }).join("");
}

function renderProjects() {
  $("#projects-grid").innerHTML = store.projects.map((project) => `
    <article class="project-card panel"><div class="project-preview"><span>✦</span><strong>LC</strong></div><div class="project-card-info"><span class="panel-kicker">${project.id === store.activeProjectId ? "ABIERTO AHORA" : "TU PROYECTO"}</span><h2>${escapeHtml(project.name || "Proyecto sin título")}</h2><p>Actualizado ${formatDate(project.updatedAt)}</p><div class="project-card-actions"><button class="button button-small open-project" data-project="${project.id}">Abrir proyecto</button>${store.projects.length > 1 ? `<button class="icon-button delete-project" data-project="${project.id}" aria-label="Eliminar proyecto" title="Eliminar proyecto">⌫</button>` : ""}</div></div></article>`).join("");
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "recientemente" : new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(date);
}

function createProject() {
  const project = starter();
  project.name = `Mi proyecto ${store.projects.length + 1}`;
  store.projects.unshift(project);
  store.activeProjectId = project.id;
  persist();
  switchView("editor");
  renderProject();
  showToast("Proyecto nuevo listo para crear.");
}

function switchView(view) {
  currentView = view;
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("active", el.id === `view-${view}`));
  document.querySelectorAll(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.view === view));
  const labels = { editor: "Mi laboratorio", missions: "Misiones", projects: "Mis proyectos" };
  $("#crumb-current").textContent = labels[view];
  if (view === "missions") renderMissions();
  if (view === "projects") renderProjects();
  if (view === "editor") requestAnimationFrame(() => requestAnimationFrame(() => updatePreview(true)));
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: "Laboratorio Creativo", version: 1, exportedAt: new Date().toISOString(), data: store }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: `laboratorio-creativo-respaldo-${new Date().toISOString().slice(0, 10)}.json` });
  link.click();
  URL.revokeObjectURL(url);
  showToast("Respaldo descargado.");
}

async function importBackup(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const incoming = parsed?.data?.version === 1 ? parsed.data : parsed?.version === 1 ? parsed : null;
    if (!incoming || !Array.isArray(incoming.projects)) throw new Error("Formato no válido");
    const projects = incoming.projects.slice(0, 100).map(normalizeProject);
    if (!projects.length) throw new Error("No hay proyectos en el respaldo");
    store.projects = projects;
    store.activeProjectId = projects.some((p) => p.id === incoming.activeProjectId) ? incoming.activeProjectId : projects[0].id;
    store.completedMissions = Array.isArray(incoming.completedMissions) ? incoming.completedMissions.filter((id) => missions.some((m) => m.id === id)) : [];
    persist();
    renderProject();
    renderProgress();
    showToast("Respaldo importado correctamente.");
  } catch {
    showToast("No se pudo importar. Elige un respaldo de Laboratorio Creativo.");
  }
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.go)));
document.querySelectorAll(".editor-tab").forEach((button) => button.addEventListener("click", () => {
  activeEditor = button.dataset.editorTab;
  document.querySelectorAll(".editor-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
  Object.entries(editors).forEach(([key, editor]) => editor.classList.toggle("active", key === activeEditor));
  editors[activeEditor].focus();
}));

Object.entries(editors).forEach(([key, editor]) => editor.addEventListener("input", () => {
  const project = activeProject();
  project[key] = editor.value;
  project.updatedAt = new Date().toISOString();
  setSavePending();
  schedulePreview();
}));

$("#project-name").addEventListener("input", (event) => {
  activeProject().name = event.target.value.slice(0, 60);
  activeProject().updatedAt = new Date().toISOString();
  setSavePending();
});
$("#run-button").addEventListener("click", () => updatePreview(true));
$("#refresh-preview").addEventListener("click", () => updatePreview(true));
$("#expand-preview").addEventListener("click", () => {
  $("#preview-dialog-frame").append($("#preview"));
  $("#preview-dialog").showModal();
});
$("#close-preview").addEventListener("click", () => $("#preview-dialog").close());
$("#preview-dialog").addEventListener("close", () => previewHost.append($("#preview")));
$("#new-project").addEventListener("click", createProject);
$("#projects-new").addEventListener("click", createProject);
$("#export-button").addEventListener("click", exportBackup);
$("#import-button").addEventListener("click", () => $("#import-file").click());
$("#import-file").addEventListener("change", (event) => { if (event.target.files[0]) importBackup(event.target.files[0]); event.target.value = ""; });
$("#copy-prompt").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("#selected-prompt").textContent); showToast("Prompt copiado. Pégalo en tu herramienta de IA."); }
  catch { showToast("No se pudo copiar automáticamente. Selecciona el texto y cópialo."); }
});
$("#mission-grid").addEventListener("click", (event) => {
  const choose = event.target.closest(".choose-mission");
  const complete = event.target.closest(".complete-mission");
  if (choose) {
    activeProject().missionId = choose.dataset.mission;
    setSavePending();
    renderSelectedMission();
    switchView("editor");
    return;
  }
  if (complete) {
    const { mission } = complete.dataset;
    store.completedMissions = store.completedMissions.includes(mission) ? store.completedMissions.filter((id) => id !== mission) : [...store.completedMissions, mission];
    persist(); renderMissions(); renderProgress();
  }
});
$("#projects-grid").addEventListener("click", (event) => {
  const open = event.target.closest(".open-project");
  const remove = event.target.closest(".delete-project");
  if (open) { store.activeProjectId = open.dataset.project; persist(); switchView("editor"); renderProject(); }
  if (remove) {
    store.projects = store.projects.filter((p) => p.id !== remove.dataset.project);
    if (store.activeProjectId === remove.dataset.project) store.activeProjectId = store.projects[0].id;
    persist(); renderProjects(); renderProject(); showToast("Proyecto eliminado.");
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); updatePreview(); }
});

renderProject();
renderProgress();
renderMissions();
