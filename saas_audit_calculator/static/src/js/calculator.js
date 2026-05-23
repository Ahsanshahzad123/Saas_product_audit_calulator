/* SaaS Product Opportunity Audit — Calculation Engine */
'use strict';

/* ─── Audience Profiles ─────────────────────────────────────────────────── */
var AUDIENCE_TYPES = {
  idea_personal: {
    label: 'Idea + Personal Investment',
    urgency: 0.85, riskMultiplier: 1.20, marketCapture: 0.60,
    insight: 'Every month of delay is money from your own pocket — and an open door for competitors to enter your market first.',
    recommendation: 'Start with a lean MVP targeting your first 10–20 paying customers. Budget 4–6 months of focused development with a reliable technical partner who has built SaaS products before.',
  },
  idea_funded: {
    label: 'Idea + Seed / Investor Funding',
    urgency: 0.95, riskMultiplier: 1.70, marketCapture: 0.75,
    insight: 'Investor runway has a hard deadline. Slow execution compresses your window to hit milestones and close your next funding round.',
    recommendation: 'Speed to a working product is everything. Investors expect milestones on schedule — a strong development partner can halve your time-to-demo and strengthen your next funding story.',
  },
  unsatisfied_team: {
    label: 'Have a Dev Team — Unsatisfied with Results',
    urgency: 0.90, riskMultiplier: 1.50, marketCapture: 0.65,
    insight: 'An underperforming team doubles your cost — you pay salaries AND lose market time simultaneously. Every month you wait makes it harder to course-correct.',
    recommendation: 'Audit your current output vs monthly spend. Switching to the right partner typically saves 40–60% long-term and recovers 3–6 months of lost velocity.',
  },
  mvp_investment: {
    label: 'Have MVP + Investment — Need Better Team',
    urgency: 0.80, riskMultiplier: 1.40, marketCapture: 0.70,
    insight: 'Your MVP proves the concept. Now you need execution speed and code quality to scale before better-funded competitors replicate your idea.',
    recommendation: 'Prioritise scalability, code quality, and feature delivery speed. The right team pays for itself within 3–4 months through faster go-to-market execution.',
  },
  mvp_ai: {
    label: 'Built MVP with AI Tools — Facing Technical Issues',
    urgency: 0.88, riskMultiplier: 1.60, marketCapture: 0.60,
    insight: 'AI-generated code carries hidden technical debt — security vulnerabilities, no scalability plan, and logic that breaks under real user loads.',
    recommendation: 'Get a professional technical audit before scaling marketing or pitching investors. Fixing AI-built MVPs early costs 3x less than a full rebuild under pressure.',
  },
  non_technical: {
    label: 'Non-Technical Founder — Limited Budget',
    urgency: 0.75, riskMultiplier: 1.10, marketCapture: 0.50,
    insight: 'Without technical knowledge, the wrong development vendor can burn your entire budget with little to show — the most common and costly founder mistake.',
    recommendation: 'Start with a discovery and prototype phase before committing to full development. Validate cheaply with a trusted partner, then scale with confidence.',
  },
};

/* ─── SaaS Type Profiles ────────────────────────────────────────────────── */
var SAAS_TYPES = {
  b2b:         { label: 'B2B SaaS (Business clients)',  competition: 0.60, timeToRevenue: 3 },
  b2c:         { label: 'B2C / Consumer SaaS',          competition: 0.85, timeToRevenue: 5 },
  marketplace: { label: 'Marketplace / Platform',       competition: 0.78, timeToRevenue: 7 },
  enterprise:  { label: 'Enterprise Software',          competition: 0.50, timeToRevenue: 9 },
};

/* ─── Calculations ──────────────────────────────────────────────────────── */

function calcOpportunityScore(audienceKey, saasKey, budget, revenueGoal) {
  var aud = AUDIENCE_TYPES[audienceKey];
  var st  = SAAS_TYPES[saasKey];
  var budgetFit    = Math.min(budget / Math.max(revenueGoal * 0.40, 1), 1);
  var marketFactor = 1 - st.competition;
  var raw = (budgetFit * 40) + (marketFactor * 35) + (aud.marketCapture * 25);
  return Math.round(Math.min(99, Math.max(10, raw)));
}

function calcMonthlyRevLost(revenueGoal, audienceKey, saasKey) {
  var aud = AUDIENCE_TYPES[audienceKey];
  var st  = SAAS_TYPES[saasKey];
  return Math.round((revenueGoal / 12) * aud.urgency * st.competition);
}

function calcDelayLoss(monthlyLoss, months, riskMultiplier) {
  var total = 0;
  for (var i = 0; i < months; i++) {
    total += monthlyLoss * Math.pow(1.05, i);
  }
  return Math.round(total * riskMultiplier);
}

function calcBudgetRange(revenueGoal) {
  var revBased = revenueGoal * 0.45;
  return {
    min: Math.max(36000, Math.round(revBased * 0.65)),
    max: Math.max(72000, Math.round(revBased * 1.10)),
  };
}

function calcROI(budget, revenueGoal) {
  if (!revenueGoal) return null;
  return Math.ceil(budget / (revenueGoal / 12));
}

function calcBuildTimeline(saasKey, budget) {
  var base  = SAAS_TYPES[saasKey].timeToRevenue;
  var speed = budget >= 80000 ? 0.65 : budget >= 40000 ? 0.80 : budget >= 20000 ? 1.0 : 1.25;
  return Math.round(base * speed);
}

function verdictLabel(score) {
  if (score >= 80) return { text: 'Strong Opportunity',                    cls: 'opp-strong'      };
  if (score >= 60) return { text: 'Good Opportunity',                      cls: 'opp-good'        };
  if (score >= 40) return { text: 'Moderate — Act Strategically',          cls: 'opp-moderate'    };
  if (score >= 20) return { text: 'Challenging — Careful Planning Needed', cls: 'opp-challenging' };
  return               { text: 'High Risk — Seek Guidance First',      cls: 'opp-risky'       };
}

/* ─── Master Run ────────────────────────────────────────────────────────── */
function runAudit(data) {
  var aud = AUDIENCE_TYPES[data.audienceType];
  var st  = SAAS_TYPES[data.saasType];

  var opportunityScore = calcOpportunityScore(data.audienceType, data.saasType, data.budget, data.revenueGoal);
  var monthlyRevLost   = calcMonthlyRevLost(data.revenueGoal, data.audienceType, data.saasType);
  var loss6Months      = calcDelayLoss(monthlyRevLost, 6,  aud.riskMultiplier);
  var loss12Months     = calcDelayLoss(monthlyRevLost, 12, aud.riskMultiplier);
  var budgetRange      = calcBudgetRange(data.revenueGoal);
  var roiMonths        = calcROI(data.budget, data.revenueGoal);
  var buildTimeline    = calcBuildTimeline(data.saasType, data.budget);
  var verdict          = verdictLabel(opportunityScore);
  var trajectory       = [];
  for (var i = 0; i <= 12; i++) {
    trajectory.push(i === 0 ? 0 : calcDelayLoss(monthlyRevLost, i, aud.riskMultiplier));
  }

  return {
    opportunityScore: opportunityScore,
    monthlyRevLost:   monthlyRevLost,
    loss6Months:      loss6Months,
    loss12Months:     loss12Months,
    budgetRange:      budgetRange,
    roiMonths:        roiMonths,
    buildTimeline:    buildTimeline,
    verdict:          verdict,
    trajectory:       trajectory,
    insight:          aud.insight,
    recommendation:   aud.recommendation,
    audienceLabel:    aud.label,
    saasLabel:        st.label,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAudit: runAudit, AUDIENCE_TYPES: AUDIENCE_TYPES, SAAS_TYPES: SAAS_TYPES };
}
