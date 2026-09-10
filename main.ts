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
  requester: { name: "Requester", description: "Starts the request", icon: "↗" },
  buyer: { name: "Buyer agent", description: "Manages the RFQ", icon: "◈" },
  supervisor: { name: "Supervisor", description: "Reviews and approves", icon: "◉" },
  seller: { name: "Supplier", description: "Sends the quote", icon: "◇" },
  receiver: { name: "Receiving agent", description: "Confirms delivery", icon: "✓" },
};

const stages: Stage[] = [
  { id: "requisition", title: "Prepare request", role: "requester", description: "Define what the department needs, the quantity, and the required delivery date.", action: "Submit request" },
  { id: "rfq", title: "Prepare request for quote", role: "buyer", description: "The buyer agent turns the request into an RFQ for the supplier.", action: "Send RFQ" },
  { id: "review", title: "Review request", role: "supervisor", description: "The request is checked for justification, budget, and priority.", action: "Send for evaluation", decision: { yes: "Approve review", no: "Request changes" } },
  { id: "quote", title: "Prepare quotation", role: "seller", description: "The supplier reviews the request and proposes price, terms, and delivery date.", action: "Send quotation" },
  { id: "evaluate", title: "Evaluate quotation", role: "buyer", description: "The received terms are compared before a decision is made.", action: "Send for approval" },
  { id: "approval", title: "Approve quotation?", role: "supervisor", description: "The supervisor decides whether the proposal meets the need and budget.", action: "Record decision", decision: { yes: "Approve quotation", no: "Reject quotation" } },
  { id: "order", title: "Prepare order", role: "buyer", description: "The approved quotation becomes a formal order for the supplier.", action: "Issue order" },
  { id: "delivery", title: "Fulfill order", role: "seller", description: "The supplier prepares and ships the requested product.", action: "Mark as shipped" },
  { id: "received", title: "Receive product", role: "receiver", description: "Receiving confirms the product arrived complete and records the delivery.", action: "Confirm receipt" },
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
    <p class="detail-kicker">${role.name} · Stage ${state.stageIndex + 1}</p>
    <h4 class="detail-title">${stage.title}</h4>
    <p class="detail-copy">${stage.description}</p>
    ${state.stageIndex === 0 ? `<div class="detail-form"><label>Product<input id="product-input" value="Ergonomic chairs" /></label><label>Quantity<input id="quantity-input" type="number" min="1" value="24" /></label></div>` : ""}
    ${state.stageIndex === 3 ? `<div class="detail-form"><label>Supplier<select id="supplier-input"><option>OfiSupply Inc.</option><option>ErgoWorld Ltd.</option></select></label><label>Quoted total<input id="amount-input" value="$ 2,880.00" /></label></div>` : ""}
    ${decisionMarkup}`;

  const advanceButton = document.getElementById("advance-button");
  advanceButton?.addEventListener("click", () => advance(stage.action));
  document.querySelectorAll<HTMLButtonElement>("[data-decision]").forEach((button) => {
    button.addEventListener("click", () => decide(button.dataset.decision as Decision));
  });
}

function renderActivity(): void {
  const list = byId("activity-list");
  byId("activity-count").textContent = `${state.activities.length} event${state.activities.length === 1 ? "" : "s"}`;
  list.innerHTML = state.activities.length ? state.activities.map((activity, index) => `<div class="activity-event"><strong>${String(index + 1).padStart(2, "0")} · ${activity.role}</strong> ${activity.message}</div>`).join("") : `<div class="empty-activity">Process events will appear here.</div>`;
}

function renderProgress(): void {
  const percent = Math.round(((state.stageIndex + 1) / stages.length) * 100);
  byId("progress-step").textContent = `Step ${state.stageIndex + 1} of ${stages.length}`;
  byId("progress-percent").textContent = `${percent}%`;
  byId("progress-fill").style.width = `${percent}%`;
  byId("flow-state").textContent = state.stageIndex === stages.length - 1 ? "Case completed" : "In progress";
}

function render(): void {
  renderRoles(); renderFlow(); renderDetails(); renderActivity(); renderProgress();
}

function advance(message: string): void {
  const stage = stages[state.stageIndex];
  let finalMessage = message;
  if (stage.id === "requisition") {
    const product = (document.getElementById("product-input") as HTMLInputElement)?.value || "Requested product";
    const quantity = (document.getElementById("quantity-input") as HTMLInputElement)?.value || "1";
    finalMessage = `Request created: ${quantity} × ${product}`;
  }
  if (stage.id === "quote") {
    const supplier = (document.getElementById("supplier-input") as HTMLSelectElement)?.value || "Selected supplier";
    finalMessage = `Quotation received from ${supplier}`;
  }
  state.activities.push({ role: roles[stage.role].name, message: finalMessage });
  if (state.stageIndex < stages.length - 1) state.stageIndex += 1;
  render();
}

function decide(decision: Decision): void {
  const stage = stages[state.stageIndex];
  const approved = decision === "approve";
  state.activities.push({ role: roles[stage.role].name, message: approved ? "Decision approved: the flow continues" : "A new proposal review is requested" });
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
