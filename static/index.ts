async function checkApiStatus() {
  const statusEl = document.getElementById("api-status");
  if (!statusEl) return;

  try {
    const [healthRes, infoRes] = await Promise.all([
      fetch("/api/health"),
      fetch("/api/info"),
    ]);

    if (healthRes.ok && infoRes.ok) {
      const health = await healthRes.json();
      const info = await infoRes.json();

      statusEl.innerHTML = `
        <div class="flex flex-col items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="badge badge-success badge-lg gap-2">
              <span class="w-2 h-2 bg-success-content rounded-full animate-pulse"></span>
              ${health.status === "ok" ? "All Systems Operational" : "Degraded"}
            </span>
          </div>
          <div class="text-sm text-base-content/70">
            ${info.name} v${info.version}
          </div>
        </div>
      `;
    } else {
      throw new Error("API response not ok");
    }
  } catch (error) {
    statusEl.innerHTML = `
      <div class="flex items-center gap-3 text-warning">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>API に接続できません（API サーバーを起動してください）</span>
      </div>
    `;
  }
}

document.addEventListener("DOMContentLoaded", checkApiStatus);
