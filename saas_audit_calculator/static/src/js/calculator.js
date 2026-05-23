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
  b2b:         { label:'B2B SaaS',          competition:.60, baseMonths:5  },
  b2c:         { label:'B2C / Consumer',    competition:.85, baseMonths:6  },
  marketplace: { label:'Marketplace',       competition:.78, baseMonths:9  },
  enterprise:  { label:'Enterprise',        competition:.50, baseMonths:14 },
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

/* ─── AI / Technology Type ──────────────────────────────────────────────── */
var AI_TYPES = {
  no_ai:     { label:'No AI features',              costMult:1.00, timeMult:1.00, note:'' },
  ai_api:    { label:'AI via API (OpenAI, Claude…)', costMult:1.20, timeMult:1.15, note:'AI API integration adds prompt engineering, reliability handling and ongoing API cost.' },
  ai_custom: { label:'Custom ML model',              costMult:1.65, timeMult:1.50, note:'Custom ML requires data pipelines, model training, evaluation and MLOps infrastructure.' },
  ai_core:   { label:'AI-powered core product',      costMult:2.00, timeMult:1.80, note:'AI-first products need significant R&D, data engineering and specialist AI/ML talent.' },
};

/* ─── Industry / Compliance ─────────────────────────────────────────────── */
var INDUSTRIES = {
  general:    { label:'General / Other',               costMult:1.00, timeMult:1.00, note:'' },
  ecommerce:  { label:'E-commerce / Retail',           costMult:1.05, timeMult:1.05, note:'' },
  hr_ops:     { label:'HR / Operations',               costMult:1.10, timeMult:1.08, note:'' },
  education:  { label:'Education / EdTech',            costMult:1.10, timeMult:1.08, note:'' },
  legal:      { label:'Legal / LegalTech',             costMult:1.30, timeMult:1.25, note:'Legal domain complexity and data sensitivity add meaningful scope to development.' },
  healthcare: { label:'Healthcare / MedTech (HIPAA)',  costMult:1.50, timeMult:1.45, note:'HIPAA compliance, audit trails and security certification add 45% to cost and timeline.' },
  fintech:    { label:'Finance / Fintech (PCI, SOC 2)',costMult:1.55, timeMult:1.50, note:'Financial regulation (PCI DSS, SOC 2) requires security audits and penetration testing.' },
};

/* ─── Core Calculations ─────────────────────────────────────────────────── */

function calcMonthlyBuildCost(complexityKey, usersKey, timelineKey, aiKey, industryKey) {
  var cmp = COMPLEXITY[complexityKey];
  var usr = TARGET_USERS[usersKey];
  var tl  = LAUNCH_TIMELINE[timelineKey];
  var ai  = AI_TYPES[aiKey]     || AI_TYPES.no_ai;
  var ind = INDUSTRIES[industryKey] || INDUSTRIES.general;
  return {
    min: Math.round(cmp.monthlyMin * usr.scaleFactor * tl.costPremium * ai.costMult * ind.costMult),
    max: Math.round(cmp.monthlyMax * usr.scaleFactor * tl.costPremium * ai.costMult * ind.costMult),
  };
}

function calcBuildTimeline(saasKey, complexityKey, budget, aiKey, industryKey) {
  var base        = SAAS_TYPES[saasKey].baseMonths;
  var cMult       = COMPLEXITY[complexityKey].timeMult;
  var ai          = AI_TYPES[aiKey]     || AI_TYPES.no_ai;
  var ind         = INDUSTRIES[industryKey] || INDUSTRIES.general;
  // Budget gives more resources but can't compress timelines linearly — realistic caps
  var speedFactor = budget >= 200000 ? 0.80 : budget >= 100000 ? 0.90 : budget >= 50000 ? 1.00 : 1.25;
  return Math.min(36, Math.max(2, Math.round(base * cMult * speedFactor * ai.timeMult * ind.timeMult)));
}

function calcScoreFactors(audienceKey, saasKey, budget, complexityKey, usersKey, timelineKey, aiKey, industryKey) {
  var aud = AUDIENCE_TYPES[audienceKey];
  var st  = SAAS_TYPES[saasKey];
  var tl  = LAUNCH_TIMELINE[timelineKey];
  var mbc = calcMonthlyBuildCost(complexityKey, usersKey, timelineKey, aiKey, industryKey);
  var bt  = calcBuildTimeline(saasKey, complexityKey, budget, aiKey, industryKey);
  var minTotal      = mbc.min * bt;
  var budgetFit     = Math.min(budget / Math.max(minTotal, 1), 1);
  var marketFactor  = 1 - st.competition;
  var urgencyFactor = Math.min(tl.urgencyMult / 1.5, 1);
  return {
    budgetFit:     budgetFit,
    marketFactor:  marketFactor,
    mktCapture:    aud.mktCapture,
    urgencyFactor: urgencyFactor,
    minBuildCost:  minTotal,
    pts: {
      budget:   Math.round(budgetFit     * 40),
      market:   Math.round(marketFactor  * 30),
      audience: Math.round(aud.mktCapture* 20),
      urgency:  Math.round(urgencyFactor * 10),
    },
  };
}

function calcOpportunityScore(audienceKey, saasKey, budget, revenueGoal, complexityKey, usersKey, timelineKey, aiKey, industryKey) {
  var f = calcScoreFactors(audienceKey, saasKey, budget, complexityKey, usersKey, timelineKey, aiKey, industryKey);
  var raw = (f.budgetFit*40) + (f.marketFactor*30) + (f.mktCapture*20) + (f.urgencyFactor*10);
  return Math.round(Math.min(99, Math.max(5, raw)));
}

function scoreTip(f, budget, fmt) {
  var pct = Math.round(f.budgetFit * 100);
  if (f.budgetFit < 0.40) return 'Your budget covers only ' + pct + '% of the estimated minimum build cost (' + fmt(f.minBuildCost) + '). Increasing your budget or choosing a simpler product scope would have the biggest impact on your score.';
  if (f.budgetFit < 0.75) return 'Your budget covers ' + pct + '% of the estimated build cost — closing this gap would add up to ' + Math.round((1 - f.budgetFit) * 40) + ' more points to your score.';
  if (f.marketFactor < 0.25) return 'You are entering a highly competitive market. Fast execution and strong product differentiation are critical to claiming your opportunity window before competitors do.';
  if (f.urgencyFactor < 0.85) return 'An ASAP timeline carries a 30% cost premium. A 3–6 month structured plan reduces risk, stretches your budget further and lifts your score.';
  return 'Your opportunity is well-balanced. Focus on shipping fast and signing your first paying customers.';
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
  if (score >= 80) return { text:'Strong Opportunity',             cls:'opp-strong'     };
  if (score >= 60) return { text:'Good Opportunity',               cls:'opp-good'       };
  if (score >= 40) return { text:'Moderate — Act Strategically',   cls:'opp-moderate'   };
  if (score >= 20) return { text:'Challenging — Plan Carefully',   cls:'opp-challenging'};
  return               { text:'High Risk — Seek Expert Guidance',  cls:'opp-risky'      };
}

function buildComplexityNotes(aiKey, industryKey) {
  var notes = [];
  var ai  = AI_TYPES[aiKey]     || AI_TYPES.no_ai;
  var ind = INDUSTRIES[industryKey] || INDUSTRIES.general;
  if (ai.note)  notes.push(ai.note);
  if (ind.note) notes.push(ind.note);
  return notes;
}

/* ─── Team Composition ──────────────────────────────────────────────────── */
var TEAM_ROLES = {
  designer: { icon:'🎨', label:'UI/UX Designer',     desc:'Branding, wireframes, user flows & visual design' },
  frontend: { icon:'💻', label:'Frontend Engineer',   desc:'React/Vue, responsive UI & performance optimisation' },
  backend:  { icon:'⚙️', label:'Backend Engineer',    desc:'APIs, database, business logic & third-party integrations' },
  sqa:      { icon:'🧪', label:'QA / Test Engineer',  desc:'Manual & automated testing, bug tracking, release sign-off' },
  pm:       { icon:'📋', label:'Project Manager',     desc:'Sprint planning, delivery milestones & stakeholder comms' },
  devops:   { icon:'🔧', label:'DevOps Engineer',     desc:'CI/CD pipelines, cloud infrastructure & monitoring' },
  aiml:     { icon:'🤖', label:'AI / ML Engineer',    desc:'Model training, data pipelines, MLOps & AI integration' },
  analyst:  { icon:'📊', label:'Business Analyst',    desc:'Requirements gathering, domain research & user stories' },
  support:  { icon:'🛟', label:'Support Engineer',    desc:'Post-launch support, incident response & onboarding' },
};

function calcTeam(complexityKey, aiKey, industryKey, usersKey) {
  var t = {
    designer: { min:1, max:1 },
    frontend: { min:1, max:2 },
    backend:  { min:1, max:2 },
    sqa:      { min:1, max:1 },
    pm:       { min:1, max:1 },
    devops:   { min:0, max:1 },
    aiml:     { min:0, max:0 },
    analyst:  { min:0, max:1 },
    support:  { min:0, max:0 },
  };

  if (complexityKey === 'standard')  { t.backend.max = 3; }
  if (complexityKey === 'complex')   { t.frontend.min=2; t.frontend.max=3; t.backend.min=2; t.backend.max=4; t.devops.min=1; t.analyst.min=1; }
  if (complexityKey === 'enterprise'){ t.frontend.min=2; t.frontend.max=4; t.backend.min=3; t.backend.max=6; t.sqa.max=2; t.pm.max=2; t.devops.min=1; t.analyst.min=1; t.support.min=1; }

  if (aiKey === 'ai_api')    { t.aiml.max = 1; }
  if (aiKey === 'ai_custom') { t.aiml.min=1; t.aiml.max=2; }
  if (aiKey === 'ai_core')   { t.aiml.min=2; t.aiml.max=3; t.backend.min=Math.max(t.backend.min,2); }

  if (industryKey === 'healthcare' || industryKey === 'fintech' || industryKey === 'legal') { t.sqa.min=1; t.analyst.min=1; }

  if (usersKey === 'large' || usersKey === 'xlarge') { t.devops.min=1; t.support.min=1; t.support.max=1; }

  var result = [];
  for (var k in t) {
    if (t[k].max > 0) result.push({ key:k, min:t[k].min, max:t[k].max });
  }
  return result;
}

/* ─── Master Run ────────────────────────────────────────────────────────── */
function runAudit(data) {
  var aud = AUDIENCE_TYPES[data.audienceType];

  var monthlyBuildCost = calcMonthlyBuildCost(data.complexityKey, data.usersKey, data.timelineKey, data.aiKey, data.industryKey);
  var buildTimeline    = calcBuildTimeline(data.saasKey, data.complexityKey, data.budget, data.aiKey, data.industryKey);
  var opportunityScore = calcOpportunityScore(data.audienceType, data.saasKey, data.budget, data.revenueGoal, data.complexityKey, data.usersKey, data.timelineKey, data.aiKey, data.industryKey);
  var monthlyRevLost   = calcMonthlyRevLost(data.revenueGoal, data.audienceType, data.saasKey, data.timelineKey);
  var loss6Months      = calcDelayLoss(monthlyRevLost, 6,  aud.riskMult);
  var loss12Months     = calcDelayLoss(monthlyRevLost, 12, aud.riskMult);
  var roiMonths        = calcROI(monthlyBuildCost.max, buildTimeline, data.revenueGoal);
  var totalBudgetMin   = monthlyBuildCost.min * buildTimeline;
  var totalBudgetMax   = monthlyBuildCost.max * buildTimeline;
  var verdict          = verdictLabel(opportunityScore);
  var complexityNotes  = buildComplexityNotes(data.aiKey, data.industryKey);
  var team             = calcTeam(data.complexityKey, data.aiKey, data.industryKey, data.usersKey);
  var teamTotalMin     = team.reduce(function(s,r){return s+r.min;},0);
  var teamTotalMax     = team.reduce(function(s,r){return s+r.max;},0);
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
    recommendation:    aud.rec,
    complexityNotes:   complexityNotes,
    team:              team,
    teamSize:          teamTotalMin + '–' + teamTotalMax + ' people',
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAudit:runAudit, AUDIENCE_TYPES:AUDIENCE_TYPES, SAAS_TYPES:SAAS_TYPES, COMPLEXITY:COMPLEXITY, TARGET_USERS:TARGET_USERS, LAUNCH_TIMELINE:LAUNCH_TIMELINE, AI_TYPES:AI_TYPES, INDUSTRIES:INDUSTRIES };
}
