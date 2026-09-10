type RoleId = "requester" | "buyer" | "supervisor" | "seller" | "receiver";
type Decision = "approve" | "reject";

type Stage = {
  id: string;
  title: string;
  role: RoleId;
  description: string;
  action: string;
  decision?: { yes: string; no: string };
};

type Activity = { role: string; message: string };

const roles: Record<RoleId, { name: string; description: string; icon: string }> = {
  requester: { name: "Solicitante", description: "Inicia la necesidad", icon: "↗" },
  buyer: { name: "Agente comprador", description: "Gestiona la RFQ", icon: "◈" },
  supervisor: { name: "Supervisor", description: "Evalúa y aprueba", icon: "◉" },
  seller: { name: "Proveedor", description: "Envía cotización", icon: "◇" },
  receiver: { name: "Recepción", description: "Confirma entrega", icon: "✓" },
};

const stages: Stage[] = [
  { id: "requisition", title: "Preparar requisición", role: "requester", description: "Define qué necesita el área, la cantidad y la fecha límite para recibirlo.", action: "Enviar requisición" },
  { id: "rfq", title: "Preparar solicitud de cotización", role: "buyer", description: "El agente comprador transforma la requisición en una RFQ para el proveedor.", action: "Enviar RFQ" },
  { id: "review", title: "Revisar requisición", role: "supervisor", description: "Se valida que la solicitud tenga justificación, presupuesto y prioridad.", action: "Pasar a evaluación", decision: { yes: "Aprobar revisión", no: "Solicitar cambios" } },
  { id: "quote", title: "Preparar cotización", role: "seller", description: "El proveedor revisa la solicitud y propone precio, condiciones y fecha de entrega.", action: "Enviar cotización" },
  { id: "evaluate", title: "Evaluar cotización", role: "buyer", description: "Se comparan las condiciones recibidas antes de tomar una decisión.", action: "Enviar a aprobación" },
  { id: "approval", title: "¿Aprueba la cotización?", role: "supervisor", description: "El supervisor decide si la propuesta responde a la necesidad y al presupuesto.", action: "Registrar decisión", decision: { yes: "Aprobar cotización", no: "Rechazar cotización" } },
  { id: "order", title: "Preparar orden", role: "buyer", description: "La cotización aprobada se convierte en una orden formal para el proveedor.", action: "Emitir orden" },
  { id: "delivery", title: "Cumplir orden", role: "seller", description: "El proveedor prepara y despacha el producto solicitado.", action: "Marcar como enviado" },
  { id: "received", title: "Recibir producto", role: "receiver", description: "Recepción confirma que el producto llegó completo y registra la entrega.", action: "Confirmar recepción" },
];

const state = { stageIndex: 0, activities: [] as Activity[] };
const byId = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

function renderRoles(): void {
  const currentRole = stages[state.stageIndex].role;
  byId("role-list").innerHTML = (Object.entries(roles) as [RoleId, typeof roles[RoleId]][]).map(([id, role]) => `
    <div class="role-item ${id === currentRole ? "active" : ""}">
      <div class="role-avatar">${role.icon}</div>
      <div><div class="role-name">${role.name}</div><div class="role-desc">${role.description}</div></div>
    </div>`).join("");
}

function renderFlow(): void {
  byId("flow-canvas").innerHTML = stages.map((stage, index) => `
    <div class="flow-node ${index === state.stageIndex ? "active" : ""} ${index < state.stageIndex ? "done" : ""}">
      <span class="node-index">${String(index + 1).padStart(2, "0")}</span>
      <span class="node-label">${stage.title}</span>
      <span class="node-role">${roles[stage.role].name}</span>
    </div>`).join("");
}

function renderDetails(): void {
  const stage = stages[state.stageIndex];
  const role = roles[stage.role];
  const decision = stage.decision;
  const decisionMarkup = decision ? `
    <div class="decision-buttons">
      <button class="primary-button" data-decision="approve">${decision.yes}</button>
      <button class="secondary-button" data-decision="reject">${decision.no}</button>
    </div>` : `<button class="primary-button" id="advance-button">${stage.action} <span>→</span></button>`;

  byId("detail-content").innerHTML = `
    <p class="detail-kicker">${role.name} · Etapa ${state.stageIndex + 1}</p>
    <h4 class="detail-title">${stage.title}</h4>
    <p class="detail-copy">${stage.description}</p>
    ${state.stageIndex === 0 ? `<div class="detail-form"><label>Producto<input id="product-input" value="Sillas ergonómicas" /></label><label>Cantidad<input id="quantity-input" type="number" min="1" value="24" /></label></div>` : ""}
    ${state.stageIndex === 3 ? `<div class="detail-form"><label>Proveedor<select id="supplier-input"><option>OfiSupply S.A.</option><option>ErgoWorld Ltd.</option></select></label><label>Total cotizado<input id="amount-input" value="$ 2.880,00" /></label></div>` : ""}
    ${decisionMarkup}`;

  const advanceButton = document.getElementById("advance-button");
  advanceButton?.addEventListener("click", () => advance(stage.action));
  document.querySelectorAll<HTMLButtonElement>("[data-decision]").forEach((button) => {
    button.addEventListener("click", () => decide(button.dataset.decision as Decision));
  });
}

function renderActivity(): void {
  const list = byId("activity-list");
  byId("activity-count").textContent = `${state.activities.length} evento${state.activities.length === 1 ? "" : "s"}`;
  list.innerHTML = state.activities.length ? state.activities.map((activity, index) => `<div class="activity-event"><strong>${String(index + 1).padStart(2, "0")} · ${activity.role}</strong> ${activity.message}</div>`).join("") : `<div class="empty-activity">Los eventos del proceso aparecerán aquí.</div>`;
}

function renderProgress(): void {
  const percent = Math.round(((state.stageIndex + 1) / stages.length) * 100);
  byId("progress-step").textContent = `Paso ${state.stageIndex + 1} de ${stages.length}`;
  byId("progress-percent").textContent = `${percent}%`;
  byId("progress-fill").style.width = `${percent}%`;
  byId("flow-state").textContent = state.stageIndex === stages.length - 1 ? "Caso completado" : "En ejecución";
}

function render(): void {
  renderRoles(); renderFlow(); renderDetails(); renderActivity(); renderProgress();
}

function advance(message: string): void {
  const stage = stages[state.stageIndex];
  let finalMessage = message;
  if (stage.id === "requisition") {
    const product = (document.getElementById("product-input") as HTMLInputElement)?.value || "Producto solicitado";
    const quantity = (document.getElementById("quantity-input") as HTMLInputElement)?.value || "1";
    finalMessage = `Requisición creada: ${quantity} × ${product}`;
  }
  if (stage.id === "quote") {
    const supplier = (document.getElementById("supplier-input") as HTMLSelectElement)?.value || "Proveedor seleccionado";
    finalMessage = `Cotización recibida de ${supplier}`;
  }
  state.activities.push({ role: roles[stage.role].name, message: finalMessage });
  if (state.stageIndex < stages.length - 1) state.stageIndex += 1;
  render();
}

function decide(decision: Decision): void {
  const stage = stages[state.stageIndex];
  const approved = decision === "approve";
  state.activities.push({ role: roles[stage.role].name, message: approved ? "Decisión aprobada: el flujo continúa" : "Se solicita una nueva revisión de la propuesta" });
  if (stage.id === "review" && !approved) state.stageIndex = 0;
  else if (stage.id === "approval" && !approved) state.stageIndex = 3;
  else if (state.stageIndex < stages.length - 1) state.stageIndex += 1;
  render();
}

function reset(): void {
  state.stageIndex = 0; state.activities = []; render();
}

byId<HTMLButtonElement>("reset-button").addEventListener("click", reset);
render();
