const D = window.DASHBOARD_DATA;
const navy = "#0a2540";
const navyMid = "#1b4a73";
const gold = "#b8860b";
const coral = "#c45c26";
const teal = "#1f7a66";

Chart.defaults.color = "#0a2540";
Chart.defaults.borderColor = "#c5d2e3";
Chart.defaults.font.family = "Source Sans 3, Segoe UI, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = "#07192d";
Chart.defaults.plugins.tooltip.titleColor = "#fff";
Chart.defaults.plugins.tooltip.bodyColor = "#fff";

const fmt = {
  n: (x) => Math.round(x).toLocaleString("en-US"),
  usd: (x) => {
    const n = Number(x);
    if (Math.abs(n) >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
    if (Math.abs(n) >= 1000) return "$" + Math.round(n).toLocaleString("en-US");
    return "$" + n.toFixed(2);
  },
  usdFull: (x) => "$" + Math.round(Number(x)).toLocaleString("en-US"),
  pct: (x) => (Number(x) * 100).toFixed(1) + "%",
  adr: (x) => "$" + Number(x).toFixed(2)
};

function kept(row) {
  return row.adr * (1 - row.cancel) * (row.nights || 1);
}

function initKpis() {
  const k = D.kpis;
  document.getElementById("kpi-bookings").textContent = fmt.n(k.bookings);
  document.getElementById("kpi-bookings-sub").textContent =
    `City ${fmt.n(k.city)} · Resort ${fmt.n(k.resort)}`;
  document.getElementById("kpi-cancel").textContent = fmt.pct(k.cancelRate);
  document.getElementById("kpi-cancel-sub").textContent =
    `${fmt.n(k.canceled)} canceled · 2023 ${fmt.pct(D.years[0].cancel)} → 2025 ${fmt.pct(D.years[2].cancel)}`;
  document.getElementById("kpi-realized").textContent = fmt.n(k.realized);
  document.getElementById("kpi-adr").textContent = fmt.adr(k.adr);
  document.getElementById("kpi-adr-sub").textContent = `Gross room revenue ${fmt.usd(k.grossRevenue)}`;
  document.getElementById("kpi-nights").textContent = Number(k.avgNights).toFixed(2);
  document.getElementById("kpi-rar").textContent = fmt.usd(k.revenueAtRisk);
}

function dual(ctx, labels, bars, adr, cancel, barTitle) {
  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Bookings", data: bars, backgroundColor: navyMid, yAxisID: "y", order: 3, borderRadius: 3 },
        { label: "ADR ($)", data: adr, type: "line", borderColor: gold, backgroundColor: gold, yAxisID: "y1", tension: 0.2, pointRadius: 4, order: 1 },
        { label: "Cancel rate (%)", data: cancel, type: "line", borderColor: coral, backgroundColor: coral, borderDash: [5, 4], yAxisID: "y1", tension: 0.2, pointRadius: 4, order: 2 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { title: { display: true, text: barTitle || "Bookings", color: navy }, ticks: { color: navy }, grid: { color: "#e4ebf3" } },
        y1: { position: "right", title: { display: true, text: "ADR ($) and cancel (%)", color: navy }, grid: { drawOnChartArea: false }, ticks: { color: navy } },
        x: { ticks: { color: navy, maxRotation: 45 } }
      }
    }
  });
}

function initCharts() {
  new Chart(document.getElementById("chart-year"), {
    type: "bar",
    data: {
      labels: D.years.map((y) => String(y.year || y.name)),
      datasets: [
        { label: "Bookings", data: D.years.map((y) => y.bookings), backgroundColor: navyMid, yAxisID: "y" },
        { label: "ADR ($)", data: D.years.map((y) => y.adr), type: "line", borderColor: gold, yAxisID: "y1", pointRadius: 5 },
        { label: "Cancel rate (%)", data: D.years.map((y) => y.cancel * 100), type: "line", borderColor: coral, borderDash: [5, 4], yAxisID: "y1", pointRadius: 5 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { title: { display: true, text: "Bookings" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "ADR ($) / cancel (%)" } }
      }
    }
  });

  new Chart(document.getElementById("chart-hotel"), {
    type: "bar",
    data: {
      labels: D.hotels.map((h) => h.name),
      datasets: [
        { label: "Bookings", data: D.hotels.map((h) => h.bookings), backgroundColor: navyMid, yAxisID: "y" },
        { label: "Cancel rate (%)", data: D.hotels.map((h) => h.cancel * 100), type: "line", borderColor: coral, yAxisID: "y1", pointRadius: 6 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { title: { display: true, text: "Bookings" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Cancel %" } }
      }
    }
  });

  dual(
    document.getElementById("chart-month"),
    D.months.map((d) => d.m),
    D.months.map((d) => d.bookings),
    D.months.map((d) => d.adr),
    D.months.map((d) => d.cancel * 100),
    "Bookings"
  );

  const segs = D.segments.filter((s) => s.name !== "Unknown");
  dual(
    document.getElementById("chart-segment"),
    segs.map((d) => d.name),
    segs.map((d) => d.bookings),
    segs.map((d) => d.adr),
    segs.map((d) => d.cancel * 100)
  );

  new Chart(document.getElementById("chart-agents"), {
    type: "bar",
    data: {
      labels: D.agents.map((a) => a.name),
      datasets: [
        { label: "Realized stays", data: D.agents.map((a) => a.bookings - a.canceled), backgroundColor: navyMid, stack: "s" },
        { label: "Canceled", data: D.agents.map((a) => a.canceled), backgroundColor: coral, stack: "s" }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { x: { stacked: true }, y: { stacked: true, title: { display: true, text: "Bookings" } } }
    }
  });

  dual(
    document.getElementById("chart-party"),
    D.party.map((d) => d.name),
    D.party.map((d) => d.bookings),
    D.party.map((d) => d.adr),
    D.party.map((d) => d.cancel * 100)
  );

  new Chart(document.getElementById("chart-lead"), {
    type: "bar",
    data: {
      labels: D.lead.map((d) => d.name),
      datasets: [
        { label: "ADR ($)", data: D.lead.map((d) => d.adr), backgroundColor: navyMid, yAxisID: "y" },
        { label: "Cancel rate (%)", data: D.lead.map((d) => d.cancel * 100), type: "line", borderColor: coral, yAxisID: "y1", pointRadius: 5 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        y: { title: { display: true, text: "ADR ($)" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Cancel %" } }
      }
    }
  });

  new Chart(document.getElementById("chart-lead-ota"), {
    type: "line",
    data: {
      labels: D.leadOta.map((d) => d.bin),
      datasets: [
        { label: "Online TA cancel %", data: D.leadOta.map((d) => d.ota * 100), borderColor: coral, backgroundColor: coral, pointRadius: 5 },
        { label: "Offline TA/TO cancel %", data: D.leadOta.map((d) => d.offline * 100), borderColor: navyMid, backgroundColor: navyMid, pointRadius: 5 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { title: { display: true, text: "Cancel %" }, suggestedMax: 60 } }
    }
  });

  new Chart(document.getElementById("chart-req"), {
    type: "bar",
    data: {
      labels: D.requests.map((d) => String(d.n)),
      datasets: [
        { label: "Bookings", data: D.requests.map((d) => d.bookings), backgroundColor: navyMid, yAxisID: "y" },
        { label: "Cancel rate (%)", data: D.requests.map((d) => d.cancel * 100), type: "line", borderColor: coral, yAxisID: "y1", pointRadius: 5 }
      ]
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      scales: {
        x: { title: { display: true, text: "Special requests" } },
        y: { title: { display: true, text: "Bookings" } },
        y1: { position: "right", grid: { drawOnChartArea: false }, title: { display: true, text: "Cancel %" } }
      }
    }
  });

  const intent = [
    ...D.parking,
    ...D.rooms,
    ...D.loyalty,
    ...D.modifications,
    D.segments.find((s) => s.name === "Online TA"),
    D.segments.find((s) => s.name === "Direct")
  ].filter(Boolean);

  new Chart(document.getElementById("chart-intent"), {
    type: "bar",
    data: {
      labels: intent.map((d) => d.name),
      datasets: [{
        label: "Cancel rate (%)",
        data: intent.map((d) => d.cancel * 100),
        backgroundColor: intent.map((d) => (d.cancel < 0.16 ? teal : d.cancel < 0.3 ? gold : coral))
      }]
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { title: { display: true, text: "Cancellation rate (%)" } } }
    }
  });
}

function rowHtml(label, r, n) {
  return `<tr>
    <td>${label}</td>
    <td class="num">${fmt.n(r.bookings)}</td>
    <td class="num">${r.canceled != null ? fmt.n(r.canceled) : "—"}</td>
    <td class="num">${fmt.pct(r.cancel)}</td>
    <td class="num">${fmt.adr(r.adr)}</td>
    <td class="num">${Number(r.nights).toFixed(2)}</td>
    <td class="num">${fmt.usd(r.revenueAtRisk)}</td>
  </tr>`;
}

function fillTables() {
  const health = [D.kpis].map(() => "");
  const cuts = [
    ["All bookings", { bookings: D.kpis.bookings, canceled: D.kpis.canceled, cancel: D.kpis.cancelRate, adr: D.kpis.adr, nights: D.kpis.avgNights, revenueAtRisk: D.kpis.revenueAtRisk }],
    ...D.years.map((y) => [String(y.year || y.name), y]),
    ...D.hotels.map((h) => [h.name, h])
  ];
  document.getElementById("tbl-health").innerHTML = cuts.map(([l, r]) => rowHtml(l, r)).join("");

  document.getElementById("tbl-month").innerHTML = D.months.map((m) => `
    <tr>
      <td>${m.month}</td>
      <td class="num">${fmt.n(m.bookings)}</td>
      <td class="num">${fmt.pct(m.cancel)}</td>
      <td class="num">${fmt.adr(m.adr)}</td>
      <td class="num">${Number(m.nights).toFixed(2)}</td>
      <td class="num">${fmt.usd(m.revenue)}</td>
      <td class="num">${fmt.usd(m.revenueAtRisk)}</td>
    </tr>`).join("");

  const n = D.kpis.bookings;
  const channelRows = [
    ...D.segments.filter((s) => s.name !== "Unknown"),
    ...D.party
  ];
  document.getElementById("tbl-channel").innerHTML = channelRows.map((r) => `
    <tr>
      <td>${r.name}</td>
      <td class="num">${fmt.n(r.bookings)}</td>
      <td class="num">${fmt.pct(r.bookings / n)}</td>
      <td class="num">${fmt.pct(r.cancel)}</td>
      <td class="num">${fmt.adr(r.adr)}</td>
      <td class="num">${fmt.adr(kept(r))}</td>
    </tr>`).join("");

  document.getElementById("playbook").innerHTML = [
    {
      id: "R1",
      src: "Data Analysis 3 · validated",
      title: "Stop steering on Online TA gross volume",
      why: `Online TA is ${fmt.pct(D.kpis.otaShare)} of bookings and ${fmt.pct(D.kpis.otaCancel)} cancel. Direct is ${fmt.pct(D.kpis.directCancel)} cancel at almost the same ADR (${fmt.adr(D.kpis.directAdr)} vs ${fmt.adr(D.kpis.otaAdr)}). Agent 9 alone is 40.2% canceled.`,
      do: "Report realized stays and expected kept revenue weekly. Shift spend to Direct (member rate, best-rate guarantee) especially for City Hotel peak weeks.",
      owner: "Revenue + digital / CRM"
    },
    {
      id: "R2",
      src: "Data Analysis 3 · updated with Excel",
      title: "Fence Online TA earlier than 60 days",
      why: "The cleaned file shows Online TA cancel already at 39.1% in the 31–60 day window (vs 21.6% inside 30 days). Offline TA/TO stays under 21% even past 180 days.",
      do: "Deposit or non-refundable fences on Online TA from 31+ days in July–August. Keep flexible rates for Direct and for November–January.",
      owner: "Revenue management"
    },
    {
      id: "R3",
      src: "Data Analysis 1 & 2 · intent charts",
      title: "Score upcoming arrivals on commitment, not only party type",
      why: "Parking requested: 0% cancel. Assigned ≠ reserved: 4.8%. Repeat: 8.2%. One special request: 22.5% vs 33.5% with zero. Zero-request, no-parking, unmodified Online TA is the high-risk pile.",
      do: "10 days before arrival, send confirm-or-release to high-risk rows so wash happens while rooms can still be resold.",
      owner: "Operations / guest communications"
    },
    {
      id: "R4",
      src: "Data Analysis 3 · seasonal split",
      title: "Split summer protection from winter volume",
      why: "August holds $7.24M gross room revenue and $2.63M inside canceled stays. Nov–Jan cancel ~21–22% with ADR in the $70s.",
      do: "July–August: MLOS + long-lead OTA fences. Nov–Jan: flexible terms and Direct campaigns to fill the floor.",
      owner: "Revenue"
    },
    {
      id: "R5",
      src: "Data Analysis 3 · loyalty",
      title: "Convert first-timers to Direct repeats",
      why: `Repeat guests are only ${fmt.pct(D.kpis.repeatRate)} of bookings (3,144) but cancel at 8.2% vs 28.4% for first-timers. They pay a lower ADR ($70.15) — they are a stability asset, not a rate asset.`,
      do: "Post-stay Direct offer for City couples and families who did not cancel. Target moving repeat share from 3.6% toward 8%.",
      owner: "CRM"
    },
    {
      id: "R6",
      src: "Excel correction vs Data Analysis 3",
      title: "Do not treat Non Refund as a low-cancel product",
      why: "Only 1,037 Non Refund bookings exist, and 94.7% are flagged canceled. In this schema that usually means prepaid no-show/forfeit, not a successful stay. Expanding Non Refund may protect cash; it will not make the cancel flag look healthy.",
      do: "Track prepaid revenue separately from stay-realized occupancy. Use deposits for OTA long lead, then audit cash collected vs is_canceled.",
      owner: "Finance + revenue"
    }
  ].map((p) => `
    <article class="card rec">
      <div class="id">${p.id}</div>
      <div>
        <div class="src">${p.src}</div>
        <h3>${p.title}</h3>
        <p class="hint"><strong>Why this matters:</strong> ${p.why}</p>
        <p class="hint"><strong>Decision:</strong> ${p.do}</p>
        <p class="hint"><strong>Owner:</strong> ${p.owner}</p>
      </div>
    </article>
  `).join("");
}

function simulate() {
  const otaShift = Number(document.getElementById("sim-direct").value) / 100;
  const fence = Number(document.getElementById("sim-fence").value) / 100;
  const loyalty = Number(document.getElementById("sim-loyal").value) / 100;
  document.getElementById("lab-direct").textContent = (otaShift * 100).toFixed(0) + "%";
  document.getElementById("lab-fence").textContent = (fence * 100).toFixed(0) + "%";
  document.getElementById("lab-loyal").textContent = (loyalty * 100).toFixed(0) + "%";

  const ota = D.segments.find((s) => s.name === "Online TA");
  const moved = ota.bookings * otaShift;
  const extraStays = moved * (ota.cancel - D.kpis.directCancel);
  const extraRev = extraStays * ota.adr * ota.nights;

  const longOta = D.leadOta.slice(1).reduce((s, r) => s + r.otaN, 0);
  const fenced = longOta * fence;
  const extraFence = fenced * (0.39 - D.kpis.directCancel);

  const first = D.loyalty.find((x) => x.name === "First-time guest");
  const repeat = D.loyalty.find((x) => x.name === "Repeat guest");
  const converted = first.bookings * loyalty;
  const extraLoyal = converted * (first.cancel - repeat.cancel);

  document.getElementById("sim-out").innerHTML = `
    If ${fmt.pct(otaShift)} of Online TA behaved like Direct, expected extra stays ≈ <strong>${fmt.n(extraStays)}</strong>
    (~${fmt.usd(extraRev)} room revenue at Online TA ADR and length of stay).<br><br>
    Fencing ${fmt.pct(fence)} of Online TA bookings made 31+ days out, if their cancel fell to the Direct rate, ≈ <strong>${fmt.n(extraFence)}</strong> extra stays.<br><br>
    Converting ${fmt.pct(loyalty)} of first-timers to repeat-guest cancel rates ≈ <strong>${fmt.n(extraLoyal)}</strong> extra stays.
  `;
}

function bindTabs() {
  document.querySelectorAll("nav.tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("nav.tabs button").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      document.querySelectorAll(".view").forEach((v) => {
        const on = v.id === btn.dataset.view;
        v.classList.toggle("active", on);
        v.hidden = !on;
      });
      requestAnimationFrame(() => {
        document.querySelectorAll("canvas").forEach((c) => {
          const ch = Chart.getChart(c);
          if (ch) ch.resize();
        });
      });
    });
  });
  ["sim-direct", "sim-fence", "sim-loyal"].forEach((id) => {
    document.getElementById(id).addEventListener("input", simulate);
  });
}

initKpis();
document.querySelectorAll(".view").forEach((v) => {
  v.hidden = false;
  v.classList.add("active");
});
initCharts();
fillTables();
document.querySelectorAll(".view").forEach((v) => {
  const on = v.id === "view-health";
  v.classList.toggle("active", on);
  v.hidden = !on;
});
bindTabs();
simulate();
