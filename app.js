/* =============================================================
   app.js — rendering + interactivity for the Capitar dashboard
   Vanilla JS, no build step, no external libraries.
   Charts are hand-drawn SVG so the whole thing is self-contained.
   ============================================================= */

(function () {
  "use strict";

  /* ---------- state ---------- */
  const state = {
    view: "home",
    unit: "lakh",            // "lakh" | "cr"
    holdingGroup: "company", // company | sector | maturity | risk
    statusFilter: null,      // filter Holdings by status via donut click
    frFilter: "Open",        // fundraising stage filter
    dpFilter: "Open",        // deployment stage filter
    activeInvestor: DATA.investors[0].id,
  };

  const STATUS = ["Performing", "Watch", "Stressed", "Exited"];
  const STATUS_CLASS = { Performing:"performing", Watch:"watch", Stressed:"stressed", Exited:"exited" };
  const STATUS_COLOR = {
    Performing:"var(--performing)", Watch:"var(--watch)",
    Stressed:"var(--stressed)", Exited:"var(--exited)"
  };

  /* ---------- money formatting ---------- */
  // base unit is Lakh. cr = lakh / 100.
  function money(lakh, opts = {}) {
    const cr = state.unit === "cr";
    const val = cr ? lakh / 100 : lakh;
    const dp = opts.dp != null ? opts.dp : (cr ? 2 : 1);
    const num = val.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });
    const unit = cr ? "Cr" : "L";
    return opts.bare ? num : `₹${num} ${unit}`;
  }
  const fmtDate = iso => {
    const d = new Date(iso + (iso.length === 7 ? "-01" : ""));
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  };
  const monthLabel = m => {
    const d = new Date(m + "-01");
    return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

  /* ---------- derived helpers ---------- */
  const activeBook = () => DATA.holdings.filter(h => h.status !== "Exited");
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

  /* =============================================================
     CHART PRIMITIVES (SVG)
     ============================================================= */

  function donut(segments, opts = {}) {
    // segments: [{label, value, color}]
    const size = opts.size || 150, sw = opts.stroke || 22, r = (size - sw) / 2, c = size / 2;
    const circ = 2 * Math.PI * r;
    const total = segments.reduce((a, s) => a + s.value, 0) || 1;
    let offset = 0;
    const arcs = segments.map(s => {
      const frac = s.value / total;
      const dash = `${frac * circ} ${circ}`;
      const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none"
        stroke="${s.color}" stroke-width="${sw}" stroke-dasharray="${dash}"
        stroke-dashoffset="${-offset * circ}" transform="rotate(-90 ${c} ${c})"
        data-seg="${esc(s.label)}" class="${opts.clickable ? 'clickable' : ''}"
        style="transition:stroke-dashoffset .3s"></circle>`;
      offset += frac;
      return el;
    }).join("");
    const center = opts.center
      ? `<text x="${c}" y="${c - 4}" text-anchor="middle" font-size="20" font-weight="650" fill="var(--text)">${opts.center}</text>
         <text x="${c}" y="${c + 14}" text-anchor="middle" font-size="11" fill="var(--text-3)">${opts.centerSub || ""}</text>`
      : "";
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${arcs}${center}</svg>`;
  }

  function hbars(rows, opts = {}) {
    // rows: [{label, value, display, color?, key?}]
    const max = Math.max(...rows.map(r => r.value), 1);
    return rows.map(r => {
      const w = (r.value / max) * 100;
      return `<div class="bar-row ${opts.clickable ? 'clickable' : ''}" ${r.key ? `data-key="${esc(r.key)}"` : ""}>
        <span class="bar-label" title="${esc(r.label)}">${esc(r.label)}</span>
        <span class="bar-track"><span class="bar-fill" style="width:${w}%;${r.color ? `background:${r.color}` : ""}"></span></span>
        <span class="bar-val">${r.display}</span>
      </div>`;
    }).join("");
  }

  // grouped vertical bars for the ALM cashflow ladder
  function ladder(rows) {
    const W = Math.max(640, rows.length * 54), H = 240, pad = { t: 16, r: 8, b: 34, l: 46 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const max = Math.max(...rows.map(r => r.principal + r.interest), 1);
    const bw = iw / rows.length, gap = bw * 0.34, colW = (bw - gap) / 2;

    const yScale = v => ih - (v / max) * ih;
    const gl = [0, .25, .5, .75, 1].map(f => {
      const y = pad.t + ih - f * ih;
      return `<line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" stroke="var(--line-soft)"/>
              <text x="${pad.l - 8}" y="${y + 3}" text-anchor="end" font-size="10" fill="var(--text-3)">${money(max * f, { bare:true, dp:0 })}</text>`;
    }).join("");

    const bars = rows.map((r, i) => {
      const x0 = pad.l + i * bw + gap / 2;
      const hP = (r.principal / max) * ih, hI = (r.interest / max) * ih;
      // expected (light) then actual overlay (solid) if present
      const expP = `<rect x="${x0}" y="${pad.t + ih - hP}" width="${colW}" height="${hP}" rx="2" fill="var(--principal)" opacity="${r.actualPrincipal != null ? .25 : 1}"/>`;
      const expI = `<rect x="${x0 + colW + 2}" y="${pad.t + ih - hI}" width="${colW}" height="${hI}" rx="2" fill="var(--interest)" opacity="${r.actualInterest != null ? .35 : 1}"/>`;
      let actual = "";
      if (r.actualPrincipal != null) {
        const ha = (r.actualPrincipal / max) * ih;
        actual += `<rect x="${x0}" y="${pad.t + ih - ha}" width="${colW}" height="${ha}" rx="2" fill="var(--principal)"/>`;
      }
      if (r.actualInterest != null) {
        const ha = (r.actualInterest / max) * ih;
        actual += `<rect x="${x0 + colW + 2}" y="${pad.t + ih - ha}" width="${colW}" height="${ha}" rx="2" fill="var(--interest)"/>`;
      }
      const lbl = `<text x="${pad.l + i * bw + bw / 2}" y="${H - 12}" text-anchor="middle" font-size="10" fill="var(--text-2)">${monthLabel(r.month)}</text>`;
      return expP + expI + actual + lbl;
    }).join("");

    return `<svg width="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMinYMid meet" style="max-width:100%">${gl}${bars}</svg>`;
  }

  // stacked horizontal bar: capitar vs investors, per instrument
  function stackRow(label, a, b) {
    const total = a + b || 1;
    return `<div style="margin:9px 0">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
        <span style="color:var(--text-2)">${esc(label)}</span>
        <span class="tnum" style="color:var(--text-3)">${money(total)}</span>
      </div>
      <div style="display:flex;height:16px;border-radius:5px;overflow:hidden;background:var(--line-soft)">
        <div style="width:${a / total * 100}%;background:var(--capitar)"></div>
        <div style="width:${b / total * 100}%;background:var(--investors)"></div>
      </div>
    </div>`;
  }

  const legend = items => `<div class="legend">${items.map(i => `<span><i style="background:${i.color}"></i>${esc(i.label)}</span>`).join("")}</div>`;

  /* =============================================================
     VIEW: HOME
     ============================================================= */
  function renderHome() {
    const book = activeBook();
    const osTotal = sum(DATA.holdings, h => h.outstanding);
    const deployed = sum(DATA.holdings, h => h.principal);
    const corpus = sum(DATA.funds, f => f.corpus);
    const onBook = sum(DATA.holdings, h => h.unitsCapitar * (h.outstanding / (h.principal || 1)));
    const soldDown = sum(DATA.holdings, h => h.unitsInvestors);
    const stressed = book.filter(h => h.status === "Stressed" || h.status === "Watch");
    const wtdCoupon = sum(book, h => h.coupon * h.outstanding) / (sum(book, h => h.outstanding) || 1);

    // fund snapshot KPIs
    const kpis = `
      <div class="grid kpis">
        ${kpi("Assets under management", money(corpus), "", `Across <b>${DATA.funds.length} funds</b> · Fund I + Fund II`)}
        ${kpi("Outstanding principal", money(osTotal), "", `Live book across <b>${book.length}</b> holdings`)}
        ${kpi("On Capitar's book", money(onBook), "", `${money(soldDown)} sold down to investors`)}
        ${kpi("Wtd. avg coupon", wtdCoupon.toFixed(1) + "%", "", `On performing + watch book`)}
      </div>`;

    // fund-wise holdings (O/S principal by fund)
    const byFund = DATA.funds.map(f => {
      const v = sum(DATA.holdings.filter(h => h.fund === f.id), h => h.outstanding);
      return { label: f.name.replace("Capitar Venture Debt ", ""), value: v, display: money(v) };
    });

    // by status donut
    const byStatus = STATUS.map(s => ({
      label: s,
      value: sum(DATA.holdings.filter(h => h.status === s), h => h.outstanding),
      color: STATUS_COLOR[s],
    })).filter(s => s.value > 0);

    const fundBlock = `
      <div class="grid two-col">
        <div class="card">
          <div class="card-h"><h3>Fund-wise portfolio holdings</h3></div>
          <p class="card-sub">Debenture holdings by fund, at current outstanding principal</p>
          ${hbars(byFund)}
        </div>
        <div class="card">
          <div class="card-h"><h3>By status</h3></div>
          <p class="card-sub">Share of outstanding principal</p>
          <div class="donut-wrap">
            ${donut(byStatus, { center: money(osTotal, { bare:true, dp:0 }), centerSub: state.unit === "cr" ? "Cr O/S" : "L O/S" })}
            <div>${legend(byStatus.map(s => ({ label: `${s.label} · ${money(s.value)}`, color: s.color })))}</div>
          </div>
        </div>
      </div>`;

    // ALM cashflow ladder
    const almBlock = `
      <div class="section-h"><h2>ALM — expected principal &amp; interest inflows</h2>
        <span class="hint">Forward cashflow ladder from live schedules; actuals overlaid where received</span></div>
      <div class="card">
        ${ladder(DATA.schedules)}
        ${legend([
          { label: "Principal (expected / actual)", color: "var(--principal)" },
          { label: "Interest (expected / actual)", color: "var(--interest)" },
        ])}
      </div>`;

    return `
      <div class="section-h"><h2>Fund snapshot</h2></div>
      ${kpis}
      <div class="section-h"><h2>Portfolio holdings</h2></div>
      ${fundBlock}
      ${almBlock}
    `;
  }

  function kpi(label, val, unit, foot) {
    return `<div class="card kpi">
      <div class="kpi-label">${label}</div>
      <div class="kpi-val tnum">${val}${unit ? `<span class="kpi-unit">${unit}</span>` : ""}</div>
      <div class="kpi-foot">${foot}</div>
    </div>`;
  }

  /* =============================================================
     VIEW: PORTFOLIO
     ============================================================= */
  function renderPortfolio() {
    // top exposures (by O/S principal, % of live book)
    const osLive = sum(activeBook(), h => h.outstanding) || 1;
    const top = [...activeBook()].sort((a, b) => b.outstanding - a.outstanding).slice(0, 6)
      .map(h => ({ label: h.company, value: h.outstanding, display: (h.outstanding / osLive * 100).toFixed(1) + "%" }));

    // by-status donut used as a filter for the table
    const byStatus = STATUS.map(s => ({
      label: s, value: sum(DATA.holdings.filter(h => h.status === s), h => h.outstanding), color: STATUS_COLOR[s],
    })).filter(s => s.value > 0);

    const topCard = `
      <div class="grid two-col">
        <div class="card">
          <div class="card-h"><h3>Top exposures</h3></div>
          <p class="card-sub">Share of live-book outstanding principal</p>
          ${hbars(top)}
        </div>
        <div class="card">
          <div class="card-h"><h3>By status</h3>${state.statusFilter ? `<button class="btn" id="clearStatus">Clear filter</button>` : ""}</div>
          <p class="card-sub">Click a segment to filter the holdings table</p>
          <div class="donut-wrap">
            <div id="statusDonut">${donut(byStatus, { clickable: true, center: money(osLive, { bare:true, dp:0 }), centerSub: state.unit === "cr" ? "Cr live" : "L live" })}</div>
            <div>${legend(byStatus.map(s => ({ label: `${s.label} · ${money(s.value)}`, color: s.color })))}</div>
          </div>
        </div>
      </div>`;

    // holdings table with group-by
    const groups = [
      ["company", "Company"], ["sector", "Sector"], ["maturity", "Maturity bucket"], ["risk", "Risk grade"]
    ];
    const chips = `<div class="chips">${groups.map(([k, l]) =>
      `<button class="chip ${state.holdingGroup === k ? "active" : ""}" data-group="${k}">${l}</button>`).join("")}</div>`;

    let rows = DATA.holdings.slice();
    if (state.statusFilter) rows = rows.filter(h => h.status === state.statusFilter);

    const table = state.holdingGroup === "company"
      ? holdingsTable(rows)
      : groupedTable(rows, state.holdingGroup);

    // units held: capitar vs investors
    const stack = activeBook().map(h => stackRow(`${h.company} · ${h.instrument}`, h.unitsCapitar, h.unitsInvestors)).join("");
    const unitsCard = `
      <div class="section-h"><h2>Units held — Capitar vs Investors</h2>
        <span class="hint">Face value on the fund's book vs sold down to secondary investors</span></div>
      <div class="card">
        ${stack}
        ${legend([{ label: "On Capitar's book", color: "var(--capitar)" }, { label: "Sold to investors", color: "var(--investors)" }])}
      </div>`;

    return `
      ${topCard}
      <div class="section-h"><h2>Holdings</h2>
        <span class="hint">Group by:</span></div>
      ${chips}
      <div style="height:12px"></div>
      ${table}
      ${unitsCard}
    `;
  }

  function holdingsTable(rows) {
    const body = rows.map(h => `
      <tr>
        <td><b>${esc(h.company)}</b></td>
        <td>${esc(h.sector)}</td>
        <td>${esc(h.instrument)}</td>
        <td class="r tnum">${h.coupon.toFixed(1)}%</td>
        <td class="r tnum">${money(h.principal)}</td>
        <td class="r tnum">${money(h.outstanding)}</td>
        <td>${fmtDate(h.maturity)}</td>
        <td><span class="grade ${h.risk}">${h.risk}</span></td>
        <td><span class="pill ${STATUS_CLASS[h.status]}">${h.status}</span></td>
      </tr>`).join("");
    return `<div class="table-wrap"><table>
      <thead><tr>
        <th>Company</th><th>Sector</th><th>Instrument</th>
        <th class="r">Coupon</th><th class="r">Principal</th><th class="r">O/S</th>
        <th>Maturity</th><th>Risk</th><th>Status</th>
      </tr></thead>
      <tbody>${body || emptyRow(9)}</tbody>
    </table></div>`;
  }

  function groupedTable(rows, groupKey) {
    const bucket = h => {
      if (groupKey === "maturity") {
        const yr = new Date(h.maturity).getFullYear();
        return `Maturing ${yr}`;
      }
      if (groupKey === "risk") return `Grade ${h.risk}`;
      return h[groupKey];
    };
    const map = {};
    rows.forEach(h => { (map[bucket(h)] = map[bucket(h)] || []).push(h); });
    const body = Object.keys(map).sort().map(k => {
      const g = map[k];
      const os = sum(g, h => h.outstanding), pr = sum(g, h => h.principal);
      const cpn = sum(g, h => h.coupon * h.outstanding) / (os || 1);
      return `<tr>
        <td><b>${esc(k)}</b></td>
        <td class="tnum">${g.length}</td>
        <td class="r tnum">${cpn.toFixed(1)}%</td>
        <td class="r tnum">${money(pr)}</td>
        <td class="r tnum">${money(os)}</td>
      </tr>`;
    }).join("");
    return `<div class="table-wrap"><table>
      <thead><tr><th>${groupKey === "maturity" ? "Maturity bucket" : groupKey === "risk" ? "Risk grade" : "Sector"}</th>
      <th>Holdings</th><th class="r">Wtd coupon</th><th class="r">Principal</th><th class="r">O/S</th></tr></thead>
      <tbody>${body || emptyRow(5)}</tbody>
    </table></div>`;
  }

  const emptyRow = n => `<tr><td colspan="${n}" style="text-align:center;color:var(--text-3);padding:26px">No holdings match this filter.</td></tr>`;

  /* =============================================================
     VIEW: PIPELINE (fundraising + deployment)
     ============================================================= */
  function renderPipeline() {
    return `
      <div class="section-h"><h2>Fundraising pipeline</h2>
        <span class="hint">Existing funds are closed &amp; fully raised — this tracks Fund II only</span></div>
      ${pipelineBoard(DATA.fundraising, "fr", r => r.type)}

      <div class="section-h"><h2>Deployment pipeline</h2>
        <span class="hint">Prospective borrowers — new logos and follow-on tranches</span></div>
      ${pipelineBoard(DATA.deployment, "dp", r => `${r.sector} · ${r.type}`)}
    `;
  }

  function pipelineBoard(items, ns, metaFn) {
    const stages = ["Open", "Won", "Lost"];
    const filterKey = ns === "fr" ? "frFilter" : "dpFilter";
    const filter = state[filterKey];

    const totalOpen = sum(items.filter(i => i.stage === "Open"), i => i.ticket);
    const totalWon = sum(items.filter(i => i.stage === "Won"), i => i.ticket);

    const chips = `<div class="chips" data-ns="${ns}">
      ${["Open", "Won", "Lost", "All"].map(s =>
        `<button class="chip ${filter === s ? "active" : ""}" data-stage="${s}">${s}</button>`).join("")}
      <span style="align-self:center;margin-left:8px;font-size:12.5px;color:var(--text-3)" class="tnum">
        Open ${money(totalOpen)} · Won ${money(totalWon)}</span>
    </div>`;

    let cols;
    if (filter === "All") {
      cols = `<div class="board">${stages.map(st => stageCol(items, st, metaFn)).join("")}</div>`;
    } else {
      const list = items.filter(i => i.stage === filter);
      cols = `<div>${list.map(i => prospectCard(i, metaFn)).join("") || `<p style="color:var(--text-3);font-size:13px">No prospects in “${filter}”.</p>`}</div>`;
    }

    return `<div style="margin-bottom:6px">${chips}</div>
      <div style="display:flex;justify-content:flex-end;margin:-30px 0 12px">
        <button class="btn primary">+ Add prospect</button></div>
      ${cols}`;
  }

  function stageCol(items, stage, metaFn) {
    const list = items.filter(i => i.stage === stage);
    const dot = { Open:"var(--accent)", Won:"var(--performing)", Lost:"var(--exited)" }[stage];
    return `<div>
      <div class="col-head"><span class="pill" style="background:transparent;color:${dot}">${stage}</span>
        <span class="col-count">${list.length}</span></div>
      ${list.map(i => prospectCard(i, metaFn)).join("") || `<p style="color:var(--text-3);font-size:12.5px">—</p>`}
    </div>`;
  }

  function prospectCard(i, metaFn) {
    return `<div class="prospect">
      <div class="p-top">
        <span class="p-name">${esc(i.name)}</span>
        <span class="p-tick tnum">${money(i.ticket)}</span>
      </div>
      <div class="p-meta">${esc(metaFn(i))}</div>
      <div class="p-note">${esc(i.note)}</div>
      <div style="display:flex;justify-content:space-between;margin-top:9px;align-items:center">
        <span class="p-tag">${esc(i.owner)}</span>
        <span style="font-size:11.5px;color:var(--text-3)">Updated ${fmtDate(i.updated)}</span>
      </div>
    </div>`;
  }

  /* =============================================================
     VIEW: INVESTORS
     ============================================================= */
  function renderInvestors() {
    const list = DATA.investors.map(inv => {
      const held = sum(DATA.investorHoldings.filter(h => h.investor === inv.id), h => h.units);
      return `<div class="inv-item ${state.activeInvestor === inv.id ? "active" : ""}" data-inv="${inv.id}">
        <div><div class="inv-name">${esc(inv.name)}</div><div class="inv-type">${esc(inv.type)}</div></div>
        <div style="text-align:right"><div class="inv-amt tnum">${money(held)}</div>
          <div class="inv-type">of ${money(inv.committed)} committed</div></div>
      </div>`;
    }).join("");

    const inv = DATA.investors.find(i => i.id === state.activeInvestor);
    const holds = DATA.investorHoldings.filter(h => h.investor === inv.id);
    const held = sum(holds, h => h.units);

    // build a simple cashflow ladder for the investor, pro-rated by their share of each company
    const invRows = DATA.schedules.map(s => {
      // pro-rate by investor's share of total sold-down face for companies they hold
      const share = held / (sum(DATA.holdings, h => h.unitsInvestors) || 1);
      return { month: s.month, principal: s.principal * share, interest: s.interest * share, actualPrincipal: s.actualPrincipal != null ? s.actualPrincipal * share : null, actualInterest: s.actualInterest != null ? s.actualInterest * share : null };
    });

    const holdRows = holds.map(h => `<tr>
      <td><b>${esc(h.company)}</b></td>
      <td class="r tnum">${money(h.units)}</td>
      <td class="r tnum">${(h.units / held * 100).toFixed(1)}%</td>
    </tr>`).join("");

    return `
      <div class="grid two-col">
        <div>
          <div class="section-h"><h2>Investors</h2><span class="hint">Secondary-market holders</span></div>
          <div class="inv-list">${list}</div>
        </div>
        <div>
          <div class="section-h"><h2>${esc(inv.name)}</h2>
            <span class="hint tnum">${money(held)} across ${holds.length} names</span></div>
          <div class="table-wrap" style="margin-bottom:16px"><table>
            <thead><tr><th>Company</th><th class="r">Units (face)</th><th class="r">Share</th></tr></thead>
            <tbody>${holdRows}</tbody>
          </table></div>
          <div class="card">
            <div class="card-h"><h3>Cashflow ladder</h3></div>
            <p class="card-sub">Expected inflows to this investor from sold-down units</p>
            ${ladder(invRows)}
            ${legend([{ label: "Principal", color: "var(--principal)" }, { label: "Interest", color: "var(--interest)" }])}
          </div>
        </div>
      </div>`;
  }

  /* =============================================================
     VIEW: DATA INPUTS
     ============================================================= */
  function renderData() {
    const cards = DATA.dataModels.map(m => {
      const sample = Object.entries(m.sample).map(([k, v]) =>
        `<b>${esc(k)}</b> ${esc(v)}`).join(" &nbsp;·&nbsp; ");
      return `<div class="card model-card">
        <div class="card-h"><h3>${esc(m.name)}</h3></div>
        <p class="card-sub">${esc(m.desc)}</p>
        <div class="model-fields">${m.fields.map(f => `<span class="field-tag">${esc(f)}</span>`).join("")}</div>
        <div class="sample-row">Sample &nbsp; ${sample}</div>
      </div>`;
    }).join("");
    return `
      <div class="section-h"><h2>Data inputs</h2>
        <span class="hint">Every data model behind the dashboard, with a live sample record</span></div>
      ${cards}`;
  }

  /* =============================================================
     ALERTS (derived from the book)
     ============================================================= */
  function buildAlerts() {
    const out = [];
    DATA.holdings.forEach(h => {
      if (h.status === "Stressed") out.push({ type: "stressed", title: `${h.company} — stressed`, body: `O/S ${money(h.outstanding)} · Grade ${h.risk}. Review recovery plan.` });
      if (h.status === "Watch") out.push({ type: "watch", title: `${h.company} — on watch`, body: `O/S ${money(h.outstanding)} · monitor MIS and bank statements.` });
    });
    // maturities within ~90 days of the sample "today"
    const today = new Date("2026-09-21");
    DATA.holdings.forEach(h => {
      const d = new Date(h.maturity), days = (d - today) / 864e5;
      if (days > 0 && days <= 120 && h.status !== "Exited")
        out.push({ type: "info", title: `${h.company} maturing soon`, body: `Matures ${fmtDate(h.maturity)} · O/S ${money(h.outstanding)}.` });
    });
    return out;
  }

  function renderAlerts() {
    const alerts = buildAlerts();
    const countEl = document.getElementById("alertsCount");
    countEl.textContent = alerts.length;
    countEl.dataset.zero = alerts.length === 0;
    document.getElementById("alertsList").innerHTML = alerts.length
      ? alerts.map(a => `<div class="alert ${a.type}"><div class="a-title">${esc(a.title)}</div><div class="a-body">${a.body}</div></div>`).join("")
      : `<p style="color:var(--text-3)">No open alerts.</p>`;
  }

  /* =============================================================
     RENDER + ROUTER
     ============================================================= */
  const TITLES = {
    home: ["Home", "Portfolio, fundraising and deployment — one glance across all of it"],
    portfolio: ["Portfolio", "Holdings, exposures and sell-down across the live book"],
    pipeline: ["Pipeline", "Fundraising for Fund II and deployment into new borrowers"],
    investors: ["Investors", "Secondary-market holdings and cashflow ladders"],
    data: ["Data Inputs", "The data models that feed every view above"],
  };

  function render() {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    const el = document.getElementById("view-" + state.view);
    const renderers = { home: renderHome, portfolio: renderPortfolio, pipeline: renderPipeline, investors: renderInvestors, data: renderData };
    el.innerHTML = renderers[state.view]();
    el.classList.add("active");

    document.getElementById("viewTitle").textContent = TITLES[state.view][0];
    document.getElementById("viewSub").textContent = TITLES[state.view][1];
    document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === state.view));

    bindViewEvents();
  }

  function bindViewEvents() {
    // portfolio: group-by chips
    document.querySelectorAll("[data-group]").forEach(b =>
      b.onclick = () => { state.holdingGroup = b.dataset.group; render(); });

    // portfolio: status donut click
    const donutEl = document.getElementById("statusDonut");
    if (donutEl) donutEl.querySelectorAll("[data-seg]").forEach(seg => {
      seg.style.cursor = "pointer";
      seg.addEventListener("click", () => {
        state.statusFilter = seg.dataset.seg === state.statusFilter ? null : seg.dataset.seg;
        render();
      });
    });
    const clr = document.getElementById("clearStatus");
    if (clr) clr.onclick = () => { state.statusFilter = null; render(); };

    // pipeline: stage chips
    document.querySelectorAll(".chips[data-ns]").forEach(box => {
      const ns = box.dataset.ns;
      box.querySelectorAll("[data-stage]").forEach(b =>
        b.onclick = () => { state[ns === "fr" ? "frFilter" : "dpFilter"] = b.dataset.stage; render(); });
    });

    // investors: select
    document.querySelectorAll("[data-inv]").forEach(b =>
      b.onclick = () => { state.activeInvestor = b.dataset.inv; render(); });
  }

  /* ---------- shell events ---------- */
  function initShell() {
    document.getElementById("nav").addEventListener("click", e => {
      const b = e.target.closest(".nav-item"); if (!b) return;
      state.view = b.dataset.view;
      document.querySelector(".sidebar")?.classList.remove("open");
      render();
    });

    document.getElementById("unitToggle").addEventListener("click", e => {
      const b = e.target.closest("[data-unit]"); if (!b) return;
      state.unit = b.dataset.unit;
      document.querySelectorAll("[data-unit]").forEach(x => x.classList.toggle("active", x === b));
      renderAlerts();
      render();
    });

    // alerts drawer
    renderAlerts();
    const drawer = document.getElementById("alertsDrawer"), scrim = document.getElementById("drawerScrim");
    const open = () => { drawer.classList.add("open"); scrim.classList.add("open"); };
    const close = () => { drawer.classList.remove("open"); scrim.classList.remove("open"); };
    document.getElementById("alertsBtn").onclick = open;
    document.getElementById("drawerClose").onclick = close;
    scrim.onclick = close;

    // mobile menu button (injected)
    const menuBtn = document.createElement("button");
    menuBtn.className = "menu-btn"; menuBtn.innerHTML = "&#9776;";
    menuBtn.onclick = () => document.querySelector(".sidebar").classList.toggle("open");
    document.querySelector(".topbar").prepend(menuBtn);
  }

  /* ---------- boot ---------- */
  initShell();
  render();
})();
