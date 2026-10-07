const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function fetchKPIs() {
  const res = await fetch(`${API_BASE}/analytics/kpis`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch KPIs");
  return res.json();
}

export async function fetchTimeseries() {
  const res = await fetch(`${API_BASE}/analytics/timeseries`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch timeseries");
  return res.json();
}

export async function fetchInventory() {
  const res = await fetch(`${API_BASE}/analytics/inventory`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function fetchDecisions(tier?: string, status?: string) {
  let url = `${API_BASE}/decisions`;
  const params = new URLSearchParams();
  if (tier) params.append("tier", tier);
  if (status) params.append("status", status);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch decisions");
  return res.json();
}

export async function runDecisionCycle() {
  const res = await fetch(`${API_BASE}/decisions/run-cycle`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to run decision cycle");
  return res.json();
}

export async function approveDecision(id: string) {
  const res = await fetch(`${API_BASE}/decisions/${id}/approve`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to approve decision");
  }
  return res.json();
}

export async function rejectDecision(id: string, reason: string) {
  const res = await fetch(`${API_BASE}/decisions/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to reject decision");
  return res.json();
}

export async function rollbackDecision(id: string) {
  const res = await fetch(`${API_BASE}/decisions/${id}/rollback`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to rollback decision");
  }
  return res.json();
}

export async function fetchAnomalies() {
  const res = await fetch(`${API_BASE}/anomalies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/policies`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function updatePolicies(payload: any) {
  const res = await fetch(`${API_BASE}/policies`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update policies");
  return res.json();
}

export async function toggleKillSwitch(active: boolean) {
  const res = await fetch(`${API_BASE}/policies/kill-switch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active, reason: "Operator UI toggle" }),
  });
  if (!res.ok) throw new Error("Failed to toggle kill switch");
  return res.json();
}

export async function fetchOutcomes() {
  const res = await fetch(`${API_BASE}/outcomes`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch outcomes");
  return res.json();
}

export async function triggerScenario(scenarioId: string) {
  const res = await fetch(`${API_BASE}/simulator/trigger-scenario`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId }),
  });
  if (!res.ok) throw new Error("Failed to trigger scenario");
  return res.json();
}

export async function reseedSimulator() {
  const res = await fetch(`${API_BASE}/simulator/seed`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reseed simulator");
  return res.json();
}
