/* SaaS Opportunity Audit — Calculation Engine */
'use strict';

/* ─── Audience Profiles ─────────────────────────────────────────────────── */
var AUDIENCE_TYPES = {
  idea_personal:    { urgency:.85, riskMult:1.20, mktCapture:.60, insight:'Every month of delay is money from your own pocket — and an open door for competitors to enter your market first.', rec:'Start with a lean MVP targeting your first 10–20 paying customers. Budget 4–6 months of focused development with a reliable technical partner who has built SaaS products before.' },
  idea_funded:      { urgency:.95, riskMult:1.70, mktCapture:.75, insight:'Investor runway has a hard deadline. Slow execution compresses your window to hit milestones and secure your next funding round.', rec:'Speed to a working product is everything. Investors expect milestones on schedule — a strong development partner can halve your time-to-demo and strengthen your funding story.' },
  unsatisfied_team: { urgency:.90, riskMult:1.50, mktCapture:.65, insight:'An underperforming team doubles your cost — you pay salaries AND lose market time simultaneously. Every month you stay costs more than switching.', rec:'Audit your current output vs monthly spend. Switching to the right partner typically saves 40–60% long-term and recovers 3–6 months of lost velocity immediately.' },
  mvp_investment:   { urgency:.80, riskMult:1.40, mktCapture:.70, insight:'Your MVP proves the concept. Now you need execution speed and code quality to scale before competitors replicate your idea with better funding.', rec:'Prioritise scalability, code quality, and feature delivery speed. The right team pays for itself within 3–4 months through faster go-to-market execution.' },
  mvp_ai:           { urgency:.88, riskMult:1.60, mktCapture:.60, insight:'AI-generated code carries hidden technical debt — security vulnerabilities, no scalability plan, and logic that breaks under real user loads.', rec:'Get a professional technical audit before scaling marketing or pitching investors. Fixing AI-built MVPs early costs 3x less than a full rebuild under pressure.' },
  non_technical:    { urgency:.75, riskMult:1.10, mktCapture:.50, insight:'Without technical knowledge, the wrong development vendor can burn your entire budget with little to show — the most common and costly founder mistake.', rec:'Start with a discovery and prototype phase before committing to full development. Validate cheaply with a trusted partner, then scale with full confidence.' },
};

/* ─── SaaS Type Profiles ────────────────────────────────────────────────── */
var SAAS_TYPES = {
  b2b:         { label:'B2B SaaS',          competition:.60, baseMonths:3 },
  b2c:         { label:'B2C / Consumer',    competition:.85, baseMonths:5 },
  marketplace: { label:'Marketplace',       competition:.78, baseMonths:7 },
  enterprise:  { label:'Enterprise',        competition:.50, baseMonths:9 },
};

/* ─── Product Complexity ────────────────────────────────────────────────── */
var COMPLEXITY = {
  mvp:        { label:'Simple MVP',        monthlyMin:8000,  monthlyMax:15000, timeMult:0.70 },
  standard:   { label:'Standard SaaS',    monthlyMin:15000, monthlyMax:28000, timeMult:1.00 },
  complex:    { label:'Complex Platform', monthlyMin:28000, monthlyMax:50000, timeMult:1.45 },
  enterprise: { label:'Enterprise-grade', monthlyMin:45000, monthlyMax:90000, timeMult:1.85 },
};

/* ─── Target User Scale ─────────────────────────────────────────────────── */
var TARGET_USERS = {
  small:  { label:'< 500 users',          scaleFactor:1.00 },
  medium: { label:'500 – 5,000 users',    scaleFactor:1.20 },
  large:  { label:'5K – 50K users',       scaleFactor:1.55 },
  xlarge: { label:'50,000+ users',        scaleFactor:1.95 },
};

/* ─── Launch Timeline ───────────────────────────────────────────────────── */
var LAUNCH_TIMELINE = {
  asap:   { label:'ASAP (< 3 months)', urgencyMult:1.50, costPremium:1.30 },
  short:  { label:'3 – 6 months',      urgencyMult:1.20, costPremium:1.10 },
  medium: { label:'6 – 12 months',     urgencyMult:1.00, costPremium:1.00 },
  long:   { label:'12+ months',        urgencyMult:0.80, costPremium:0.90 },
};

/* ─── Core Calculations ─────────────────────────────────────────────────── */

function calcMonthlyBuildCost(complexityKey, usersKey, timelineKey) {
  var cmp = COMPLEXITY[complexityKey];
  var usr = TARGET_USERS[usersKey];
  var tl  = LAUNCH_TIMELINE[timelineKey];
  return {
    min: Math.round(cmp.monthlyMin * usr.scaleFactor * tl.costPremium),
    max: Math.round(cmp.monthlyMax * usr.scaleFactor * tl.costPremium),
  };
}

function calcBuildTimeline(saasKey, complexityKey, budget) {
  var base  = SAAS_TYPES[saasKey].baseMonths;
  var cMult = COMPLEXITY[complexityKey].timeMult;
  var speedFactor = budget >= 100000 ? 0.60 : budget >= 60000 ? 0.75 : budget >= 30000 ? 0.90 : 1.15;
  return Math.max(1, Math.round(base * cMult * speedFactor));
}

function calcOpportunityScore(audienceKey, saasKey, budget, revenueGoal, complexityKey, usersKey, timelineKey) {
  var aud  = AUDIENCE_TYPES[audienceKey];
  var st   = SAAS_TYPES[saasKey];
  var tl   = LAUNCH_TIMELINE[timelineKey];
  var mbc  = calcMonthlyBuildCost(complexityKey, usersKey, timelineKey);
  var bt   = calcBuildTimeline(saasKey, complexityKey, budget);

  // Budget adequacy vs minimum realistic build cost
  var minTotal   = mbc.min * bt;
  var budgetFit  = Math.min(budget / Math.max(minTotal, 1), 1);

  // Market opportunity (lower competition = better window)
  var marketFactor = 1 - st.competition;

  // Timeline urgency (shorter = higher opportunity risk)
  var urgencyFactor = Math.min(tl.urgencyMult / 1.5, 1);

  var raw = (budgetFit * 40) + (marketFactor * 30) + (aud.mktCapture * 20) + (urgencyFactor * 10);
  return Math.round(Math.min(99, Math.max(5, raw)));
}

function calcMonthlyRevLost(revenueGoal, audienceKey, saasKey, timelineKey) {
  var aud = AUDIENCE_TYPES[audienceKey];
  var st  = SAAS_TYPES[saasKey];
  var tl  = LAUNCH_TIMELINE[timelineKey];
  return Math.round((revenueGoal / 12) * aud.urgency * st.competition * tl.urgencyMult);
}

function calcDelayLoss(monthlyLoss, months, riskMult) {
  var total = 0;
  for (var i = 0; i < months; i++) total += monthlyLoss * Math.pow(1.05, i);
  return Math.round(total * riskMult);
}

function calcROI(monthlyBuildCostMax, buildMonths, revenueGoal) {
  if (!revenueGoal) return null;
  var totalInvestment = monthlyBuildCostMax * buildMonths;
  return Math.ceil(totalInvestment / (revenueGoal / 12));
}

function verdictLabel(score) {
  if (score >= 80) return { text:'Strong Opportunity',                   cls:'opp-strong'     };
  if (score >= 60) return { text:'Good Opportunity',                     cls:'opp-good'       };
  if (score >= 40) return { text:'Moderate — Act Strategically',         cls:'opp-moderate'   };
  if (score >= 20) return { text:'Challenging — Plan Carefully',         cls:'opp-challenging'};
  return               { text:'High Risk — Seek Expert Guidance',    cls:'opp-risky'      };
}

/* ─── Master Run ────────────────────────────────────────────────────────── */
function runAudit(data) {
  var aud = AUDIENCE_TYPES[data.audienceType];

  var monthlyBuildCost = calcMonthlyBuildCost(data.complexityKey, data.usersKey, data.timelineKey);
  var buildTimeline    = calcBuildTimeline(data.saasKey, data.complexityKey, data.budget);
  var opportunityScore = calcOpportunityScore(data.audienceType, data.saasKey, data.budget, data.revenueGoal, data.complexityKey, data.usersKey, data.timelineKey);
  var monthlyRevLost   = calcMonthlyRevLost(data.revenueGoal, data.audienceType, data.saasKey, data.timelineKey);
  var loss6Months      = calcDelayLoss(monthlyRevLost, 6,  aud.riskMult);
  var loss12Months     = calcDelayLoss(monthlyRevLost, 12, aud.riskMult);
  var roiMonths        = calcROI(monthlyBuildCost.max, buildTimeline, data.revenueGoal);
  var totalBudgetMin   = monthlyBuildCost.min * buildTimeline;
  var totalBudgetMax   = monthlyBuildCost.max * buildTimeline;
  var verdict          = verdictLabel(opportunityScore);
  var trajectory       = [];
  for (var i = 0; i <= 12; i++) trajectory.push(i === 0 ? 0 : calcDelayLoss(monthlyRevLost, i, aud.riskMult));

  return {
    opportunityScore:  opportunityScore,
    monthlyRevLost:    monthlyRevLost,
    loss6Months:       loss6Months,
    loss12Months:      loss12Months,
    monthlyBuildCost:  monthlyBuildCost,
    totalBudgetMin:    totalBudgetMin,
    totalBudgetMax:    totalBudgetMax,
    buildTimeline:     buildTimeline,
    roiMonths:         roiMonths,
    verdict:           verdict,
    trajectory:        trajectory,
    insight:           aud.insight,
    recommendation:    aud.recommendation,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAudit:runAudit, AUDIENCE_TYPES:AUDIENCE_TYPES, SAAS_TYPES:SAAS_TYPES, COMPLEXITY:COMPLEXITY, TARGET_USERS:TARGET_USERS, LAUNCH_TIMELINE:LAUNCH_TIMELINE };
}
