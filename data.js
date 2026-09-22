/* =============================================================
   data.js — sample dataset for the Capitar Portfolio Ops & MIS
   -------------------------------------------------------------
   All money amounts are stored in a single base unit: INR Lakh.
   The UI converts to ₹ Lakh / ₹ Cr at render time (1 Cr = 100 L).
   This is dummy data built to resemble a small venture-debt book.
   ============================================================= */

const DATA = {

  /* ---- Funds -------------------------------------------------
     Existing funds are closed-ended and fully raised/deployed.
     The new fund (Fund II) is the one actively fundraising.      */
  funds: [
    { id: "F1", name: "Capitar Venture Debt Fund I",  vintage: 2022, corpus: 10000, status: "Deploying",   closeType: "Closed-ended", raised: 10000 },
    { id: "F2", name: "Capitar Venture Debt Fund II", vintage: 2026, corpus: 35000, status: "Fundraising", closeType: "Closed-ended", raised: 12250 },
  ],

  /* ---- Holdings ----------------------------------------------
     One row = one debenture (NCD) tranche the fund originated.
     principal      = original disbursed face value (Lakh)
     outstanding    = current O/S principal (Lakh)
     unitsCapitar   = face value still on the fund's own book
     unitsInvestors = face value sold down to secondary investors
     (unitsCapitar + unitsInvestors = principal)                  */
  holdings: [
    { id:"H01", company:"BioPrime",     sector:"Agri-Biotech",  fund:"F1", instrument:"NCD Series A", coupon:16.5, principal:800,  outstanding:520, disbursed:"2023-04-12", maturity:"2026-04-12", risk:"A", status:"Performing", unitsCapitar:500, unitsInvestors:300 },
    { id:"H02", company:"Artment",      sector:"Consumer",      fund:"F1", instrument:"NCD Series A", coupon:17.0, principal:600,  outstanding:410, disbursed:"2023-07-01", maturity:"2026-07-01", risk:"B", status:"Watch",      unitsCapitar:450, unitsInvestors:150 },
    { id:"H03", company:"Simple Energy",sector:"EV / Mobility", fund:"F1", instrument:"NCD Series B", coupon:15.5, principal:1200, outstanding:900, disbursed:"2023-09-15", maturity:"2027-09-15", risk:"A", status:"Performing", unitsCapitar:800, unitsInvestors:400 },
    { id:"H04", company:"Daryaganj",    sector:"F&B / Cloud Kitchen", fund:"F1", instrument:"NCD Series A", coupon:18.0, principal:450, outstanding:290, disbursed:"2024-01-20", maturity:"2027-01-20", risk:"B", status:"Performing", unitsCapitar:300, unitsInvestors:150 },
    { id:"H05", company:"Zephyr Health",sector:"Healthtech",    fund:"F1", instrument:"NCD Series A", coupon:16.0, principal:700,  outstanding:700, disbursed:"2024-06-10", maturity:"2027-06-10", risk:"A", status:"Performing", unitsCapitar:700, unitsInvestors:0 },
    { id:"H06", company:"Loomcraft",    sector:"D2C / Apparel",  fund:"F1", instrument:"NCD Series A", coupon:17.5, principal:350, outstanding:120, disbursed:"2022-11-05", maturity:"2025-11-05", risk:"C", status:"Stressed",   unitsCapitar:200, unitsInvestors:150 },
    { id:"H07", company:"Nimbus Logistics", sector:"Logistics", fund:"F1", instrument:"NCD Series A", coupon:16.5, principal:900, outstanding:0,   disbursed:"2022-05-18", maturity:"2025-05-18", risk:"B", status:"Exited",    unitsCapitar:600, unitsInvestors:300 },
    { id:"H08", company:"Kairo AI",     sector:"SaaS / AI",     fund:"F1", instrument:"NCD Series B", coupon:15.0, principal:1000, outstanding:820, disbursed:"2024-09-01", maturity:"2027-09-01", risk:"A", status:"Performing", unitsCapitar:700, unitsInvestors:300 },
    { id:"H09", company:"Verde Foods",  sector:"F&B / Cloud Kitchen", fund:"F1", instrument:"NCD Series A", coupon:18.5, principal:400, outstanding:340, disbursed:"2024-11-22", maturity:"2027-11-22", risk:"B", status:"Watch",      unitsCapitar:250, unitsInvestors:150 },
    { id:"H10", company:"Volton Mobility", sector:"EV / Mobility", fund:"F1", instrument:"NCD Series A", coupon:16.0, principal:550, outstanding:480, disbursed:"2025-02-14", maturity:"2028-02-14", risk:"A", status:"Performing", unitsCapitar:400, unitsInvestors:150 },
  ],

  /* ---- Repayment schedules -----------------------------------
     Forward principal + interest inflows, monthly, per holding.
     'actual' present => cashflow already received (overlay).      */
  schedules: [
    // month is YYYY-MM ; amounts in Lakh
    { month:"2026-09", principal:180, interest:96,  actualPrincipal:178, actualInterest:95 },
    { month:"2026-10", principal:165, interest:92,  actualPrincipal:165, actualInterest:91 },
    { month:"2026-11", principal:210, interest:104, actualPrincipal:null, actualInterest:null },
    { month:"2026-12", principal:190, interest:88,  actualPrincipal:null, actualInterest:null },
    { month:"2027-01", principal:230, interest:110, actualPrincipal:null, actualInterest:null },
    { month:"2027-02", principal:175, interest:82,  actualPrincipal:null, actualInterest:null },
    { month:"2027-03", principal:260, interest:120, actualPrincipal:null, actualInterest:null },
    { month:"2027-04", principal:300, interest:98,  actualPrincipal:null, actualInterest:null },
    { month:"2027-05", principal:150, interest:74,  actualPrincipal:null, actualInterest:null },
    { month:"2027-06", principal:280, interest:112, actualPrincipal:null, actualInterest:null },
    { month:"2027-07", principal:200, interest:70,  actualPrincipal:null, actualInterest:null },
    { month:"2027-08", principal:190, interest:66,  actualPrincipal:null, actualInterest:null },
  ],

  /* ---- Secondary-market investors ----------------------------
     Investors who bought down units from the fund's originations. */
  investors: [
    { id:"I1", name:"Ashwin Family Office", type:"Family Office", committed:1200 },
    { id:"I2", name:"Meridian Wealth NBFC", type:"NBFC",          committed:900  },
    { id:"I3", name:"Sundara HNI Syndicate",type:"HNI Syndicate", committed:700  },
    { id:"I4", name:"Crestline Capital",    type:"Family Office", committed:450  },
  ],

  /* investor holdings sourced from the trade blotter (Lakh face) */
  investorHoldings: [
    { investor:"I1", company:"BioPrime",      units:150 },
    { investor:"I1", company:"Simple Energy", units:250 },
    { investor:"I1", company:"Kairo AI",      units:150 },
    { investor:"I2", company:"Artment",       units:150 },
    { investor:"I2", company:"Simple Energy", units:150 },
    { investor:"I2", company:"Nimbus Logistics", units:120 },
    { investor:"I3", company:"Daryaganj",     units:150 },
    { investor:"I3", company:"Loomcraft",     units:150 },
    { investor:"I3", company:"Volton Mobility", units:150 },
    { investor:"I4", company:"BioPrime",      units:150 },
    { investor:"I4", company:"Verde Foods",   units:150 },
    { investor:"I4", company:"Kairo AI",      units:150 },
  ],

  /* ---- Fundraising pipeline (LPs into Fund II) ---------------- */
  fundraising: [
    { id:"FR1", name:"Nirvana Endowment",      type:"Institutional", ticket:5000, stage:"Won",  owner:"Sparsh",  updated:"2026-08-30", note:"Committed, docs signed" },
    { id:"FR2", name:"Highmark Pension Trust", type:"Institutional", ticket:7500, stage:"Open", owner:"Rohan",   updated:"2026-09-12", note:"IC review scheduled" },
    { id:"FR3", name:"Beacon Fund-of-Funds",   type:"FoF",           ticket:6000, stage:"Open", owner:"Sparsh",  updated:"2026-09-15", note:"DD in progress" },
    { id:"FR4", name:"Anand Family Trust",     type:"Family Office", ticket:2500, stage:"Won",  owner:"Priya",   updated:"2026-08-20", note:"Committed" },
    { id:"FR5", name:"Sierra Global",          type:"Institutional", ticket:8000, stage:"Lost", owner:"Rohan",   updated:"2026-07-28", note:"Passed — mandate mismatch" },
    { id:"FR6", name:"Orbit Capital Partners", type:"FoF",           ticket:4000, stage:"Open", owner:"Priya",   updated:"2026-09-18", note:"First call done" },
  ],

  /* ---- Deployment pipeline (prospective borrowers) ----------- */
  deployment: [
    { id:"DP1", name:"Meadowlark Bio",  sector:"Agri-Biotech", ticket:900,  type:"New logo",  stage:"Open", owner:"Sparsh", updated:"2026-09-14", note:"Term sheet drafted" },
    { id:"DP2", name:"Simple Energy",   sector:"EV / Mobility",ticket:600,  type:"Follow-on", stage:"Open", owner:"Rohan",  updated:"2026-09-10", note:"Tranche 2 — Series B" },
    { id:"DP3", name:"Cobalt Robotics", sector:"SaaS / AI",    ticket:1100, stage:"Open", type:"New logo", owner:"Priya",  updated:"2026-09-17", note:"Financials under review" },
    { id:"DP4", name:"Kairo AI",        sector:"SaaS / AI",    ticket:500,  type:"Follow-on", stage:"Won",  owner:"Sparsh", updated:"2026-08-25", note:"Disbursed Sep '26" },
    { id:"DP5", name:"Harvest Kitchens",sector:"F&B / Cloud Kitchen", ticket:400, type:"New logo", stage:"Lost", owner:"Rohan", updated:"2026-07-30", note:"Declined — unit economics" },
    { id:"DP6", name:"Aether Health",   sector:"Healthtech",   ticket:750,  type:"New logo",  stage:"Open", owner:"Priya",  updated:"2026-09-19", note:"Founder intro via portfolio" },
  ],

  /* ---- Data-model catalogue (Data Inputs tab) ----------------
     Describes what users actually enter behind each dashboard.    */
  dataModels: [
    {
      name: "Holding / Debenture",
      desc: "One NCD tranche the fund originates and holds.",
      fields: ["Company", "Sector", "Fund", "Instrument", "Coupon %", "Principal (face)", "Outstanding principal", "Disbursed date", "Maturity date", "Risk grade", "Status"],
      sample: { Company:"BioPrime", Fund:"Fund I", Coupon:"16.5%", Principal:"₹8.00 Cr", Maturity:"12 Apr 2026", Risk:"A", Status:"Performing" }
    },
    {
      name: "Repayment schedule",
      desc: "Expected principal + interest cashflows per holding, per month.",
      fields: ["Holding", "Month", "Expected principal", "Expected interest", "Actual principal", "Actual interest"],
      sample: { Holding:"BioPrime NCD-A", Month:"Sep 2026", ExpPrincipal:"₹1.80 Cr", ExpInterest:"₹0.96 Cr", Received:"Yes" }
    },
    {
      name: "Investor",
      desc: "A secondary-market buyer of sold-down units.",
      fields: ["Name", "Type", "Total committed"],
      sample: { Name:"Ashwin Family Office", Type:"Family Office", Committed:"₹12.00 Cr" }
    },
    {
      name: "Trade blotter entry",
      desc: "A sell-down of units from the fund's book to an investor.",
      fields: ["Investor", "Company", "Units (face value)", "Trade date"],
      sample: { Investor:"Ashwin FO", Company:"BioPrime", Units:"₹1.50 Cr", Date:"20 Apr 2023" }
    },
    {
      name: "Fundraising prospect",
      desc: "A prospective LP for the new fund.",
      fields: ["Name", "Type", "Target ticket", "Stage", "Owner", "Last updated", "Note"],
      sample: { Name:"Highmark Pension Trust", Ticket:"₹75 Cr", Stage:"Open", Owner:"Rohan" }
    },
    {
      name: "Deployment prospect",
      desc: "A prospective borrower — new logo or follow-on tranche.",
      fields: ["Name", "Sector", "Ticket size", "Type", "Stage", "Owner", "Last updated", "Note"],
      sample: { Name:"Cobalt Robotics", Ticket:"₹11.00 Cr", Type:"New logo", Stage:"Open" }
    },
  ],
};
