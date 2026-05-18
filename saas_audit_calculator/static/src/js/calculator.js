/* SaaS Product Audit Calculator — Core Engine */
'use strict';

/* ─── Lookup Tables ─────────────────────────────────────────────────────── */

const ARCH_MATURITY = {
    mvp_spaghetti: {
        label: 'MVP (Spaghetti Code)',
        debtRatio: 0.80,
        velocityPenalty: 0.65,
        maintenanceCost: 0.35,
        bugRate: 0.45,
        securityRisk: 0.75,
        scalabilityLimit: 2,
        refactorMonths: 4,
        ci_cd: false,
        testCoverage: 0.05,
    },
    early_structured: {
        label: 'Early Stage (Some Structure)',
        debtRatio: 0.55,
        velocityPenalty: 0.45,
        maintenanceCost: 0.25,
        bugRate: 0.30,
        securityRisk: 0.55,
        scalabilityLimit: 5,
        refactorMonths: 3,
        ci_cd: false,
        testCoverage: 0.20,
    },
    scaling_modular: {
        label: 'Scaling (Microservices/Modular)',
        debtRatio: 0.25,
        velocityPenalty: 0.20,
        maintenanceCost: 0.15,
        bugRate: 0.15,
        securityRisk: 0.30,
        scalabilityLimit: 20,
        refactorMonths: 1.5,
        ci_cd: true,
        testCoverage: 0.60,
    },
    mature_best_practice: {
        label: 'Mature (Best Practices)',
        debtRatio: 0.08,
        velocityPenalty: 0.05,
        maintenanceCost: 0.08,
        bugRate: 0.05,
        securityRisk: 0.10,
        scalabilityLimit: 100,
        refactorMonths: 0.5,
        ci_cd: true,
        testCoverage: 0.85,
    },
};

const STARTUP_STAGES = {
    seed: {
        label: 'Seed',
        fundingPressure: 0.90,
        marketWindowMonths: 6,
        competitorRisk: 0.80,
        burnRunwayIdeal: 18,
        valuationMultiplier: 3,
        urgencyMult: 2.0,
    },
    pre_series_a: {
        label: 'Pre-Series A',
        fundingPressure: 0.75,
        marketWindowMonths: 9,
        competitorRisk: 0.65,
        burnRunwayIdeal: 18,
        valuationMultiplier: 5,
        urgencyMult: 1.7,
    },
    series_a: {
        label: 'Series A',
        fundingPressure: 0.60,
        marketWindowMonths: 12,
        competitorRisk: 0.50,
        burnRunwayIdeal: 24,
        valuationMultiplier: 8,
        urgencyMult: 1.4,
    },
    series_b_plus: {
        label: 'Series B+',
        fundingPressure: 0.40,
        marketWindowMonths: 18,
        competitorRisk: 0.35,
        burnRunwayIdeal: 24,
        valuationMultiplier: 12,
        urgencyMult: 1.2,
    },
};

/* ─── Health Score ──────────────────────────────────────────────────────── */

function calculateHealthScore(data) {
    const arch  = ARCH_MATURITY[data.architecture];
    const stage = STARTUP_STAGES[data.stage];
    const t     = data.team;

    const totalEngineering = (t.engineers || 0) + (t.devops || 0);
    const totalTeam = (t.pm || 0) + (t.ux || 0) + (t.engineers || 0)
                    + (t.qa || 0) + (t.devops || 0) + (t.support || 0);

    // 1. Architecture score  (0–35)
    const archScore = (1 - arch.debtRatio) * 35;

    // 2. QA coverage  (0–20)   optimal ratio = 1 QA per 3 engineers
    const qaRatio   = (t.qa || 0) / Math.max(totalEngineering, 1);
    const qaScore   = Math.min(qaRatio / 0.33, 1.0) * 20;

    // 3. DevOps maturity  (0–15)   optimal ≥15% of team
    const devopsRatio = (t.devops || 0) / Math.max(totalTeam, 1);
    const devopsScore = Math.min(devopsRatio / 0.15, 1.0) * 15;

    // 4. CI/CD & test coverage bonus  (0–10)
    const ciBonus  = arch.ci_cd ? 5 : 0;
    const testBonus = arch.testCoverage * 5;

    // 5. Team balance  (0–10)  — penalise severe imbalances
    const pmRatio      = (t.pm || 0) / Math.max(totalTeam, 1);
    const supportRatio = (t.support || 0) / Math.max(totalTeam, 1);
    const balanceScore = (
        Math.min(pmRatio / 0.10, 1.0) * 0.4 +
        Math.min(supportRatio / 0.10, 1.0) * 0.3 +
        Math.min((t.ux || 0) / Math.max(totalTeam, 1) / 0.10, 1.0) * 0.3
    ) * 10;

    // 6. Stage risk  (0–10)   earlier stage = more exposure
    const stageScore = (1 - stage.competitorRisk) * 10;

    const raw = archScore + qaScore + devopsScore + ciBonus + testBonus + balanceScore + stageScore;
    return Math.max(0, Math.min(100, Math.round(raw)));
}

/* ─── Grading & Risk Labels ─────────────────────────────────────────────── */

function getEfficiencyGrade(score) {
    if (score >= 90) return { grade: 'A+', color: '#00c853' };
    if (score >= 80) return { grade: 'A',  color: '#00c853' };
    if (score >= 70) return { grade: 'B+', color: '#64dd17' };
    if (score >= 60) return { grade: 'B',  color: '#aeea00' };
    if (score >= 50) return { grade: 'C',  color: '#ffd600' };
    if (score >= 40) return { grade: 'D',  color: '#ff6d00' };
    if (score >= 30) return { grade: 'D-', color: '#dd2c00' };
    return { grade: 'F', color: '#b71c1c' };
}

function getRiskLevel(score) {
    if (score >= 70) return { level: 'Low',      badgeClass: 'risk-low',      color: '#1b5e20' };
    if (score >= 50) return { level: 'Medium',   badgeClass: 'risk-medium',   color: '#e65100' };
    if (score >= 30) return { level: 'High',     badgeClass: 'risk-high',     color: '#bf360c' };
    return              { level: 'Critical', badgeClass: 'risk-critical', color: '#b71c1c' };
}

/* ─── Financial Calculations ────────────────────────────────────────────── */

function calculateFinancials(data) {
    const arch    = ARCH_MATURITY[data.architecture];
    const stage   = STARTUP_STAGES[data.stage];
    const burn    = data.burnRate   || 0;
    const revenue = data.revenue    || burn * 0.30; // estimate if not provided

    // Burn Inefficiency: wasted burn on maintenance + bug-fixing overhead
    const maintenanceWaste   = burn * arch.maintenanceCost;
    const bugFixingWaste     = burn * arch.bugRate * 0.55;
    const burnInefficiency   = Math.round(maintenanceWaste + bugFixingWaste);

    // Delay Cost: slower delivery × market urgency
    const delayFactor = arch.velocityPenalty * stage.urgencyMult;
    const delayCost   = Math.round(burn * delayFactor * 0.75);

    // Lost Opportunity: revenue not captured due to poor product velocity
    const oppLoss       = revenue * arch.debtRatio * stage.competitorRisk;
    const lostOpportunity = Math.round(oppLoss);

    // Monthly Total Cost of Delay
    const monthlyTotalCOD = burnInefficiency + delayCost + lostOpportunity;

    // Annualised COD with compound drift (debt compounds ~8% p/month)
    const compoundRate = 1 + arch.debtRatio * 0.08;
    const annualCOD    = Math.round(monthlyTotalCOD * 12 * compoundRate);

    // Future Refactor Cost (cost to fix later = N months of burn)
    const refactorCost = Math.round(burn * arch.refactorMonths);

    // Security Incident Risk (annualised expected loss)
    const avgBreachCost    = 120000; // SMB average
    const securityRiskCost = Math.round(avgBreachCost * arch.securityRisk);

    // Valuation At Stake (next-round delta killed by poor execution)
    const valuationAtRisk = Math.round(annualCOD * stage.valuationMultiplier * 0.5);

    // Productivity Recovery Potential (if fixed now vs 12 months later)
    const recoveryPotential = Math.round(annualCOD * (1 - 1 / compoundRate) * 12);

    return {
        burnInefficiency,
        delayCost,
        lostOpportunity,
        monthlyTotalCOD,
        annualCOD,
        refactorCost,
        securityRiskCost,
        valuationAtRisk,
        recoveryPotential,
    };
}

/* ─── Benchmark Percentile ──────────────────────────────────────────────── */

function calculateBenchmark(healthScore, stage) {
    // Industry distributions (p25 / p50 / p75) per stage
    const benchmarks = {
        seed:        { p25: 22, p50: 38, p75: 58 },
        pre_series_a:{ p25: 28, p50: 46, p75: 63 },
        series_a:    { p25: 38, p50: 56, p75: 72 },
        series_b_plus:{ p25: 52, p50: 68, p75: 84 },
    };
    const b = benchmarks[stage] || benchmarks.seed;

    let percentile;
    if      (healthScore >= b.p75) percentile = 75 + ((healthScore - b.p75) / (100 - b.p75)) * 25;
    else if (healthScore >= b.p50) percentile = 50 + ((healthScore - b.p50) / (b.p75 - b.p50)) * 25;
    else if (healthScore >= b.p25) percentile = 25 + ((healthScore - b.p25) / (b.p50 - b.p25)) * 25;
    else                           percentile = (healthScore / Math.max(b.p25, 1)) * 25;

    percentile = Math.max(1, Math.min(99, Math.round(percentile)));
    const bottom = 100 - percentile;

    return {
        percentile,
        bottom,
        lowerThanPct: Math.round(100 - percentile),
    };
}

/* ─── Trajectory (12 months) ────────────────────────────────────────────── */

function calculateTrajectory(monthlyTotalCOD, architecture, months) {
    const arch         = ARCH_MATURITY[architecture];
    const compoundRate = arch.debtRatio * 0.10; // 10% drift/month for spaghetti
    const points       = [];

    for (let i = 0; i <= months; i++) {
        points.push(Math.round(monthlyTotalCOD * Math.pow(1 + compoundRate, i)));
    }
    return points;
}

/* ─── Detailed Audit Text ───────────────────────────────────────────────── */

function generateDetailedAudit(data, financials, healthScore) {
    const arch  = ARCH_MATURITY[data.architecture];
    const stage = STARTUP_STAGES[data.stage];
    const t     = data.team;
    const total = Object.values(t).reduce((a, b) => a + (b || 0), 0);
    const grade = getEfficiencyGrade(healthScore);
    const risk  = getRiskLevel(healthScore);

    const fmt = n => '$' + n.toLocaleString();

    const sections = [];

    /* Executive Summary */
    sections.push({
        title: '📋 Executive Summary',
        content: `Your startup is operating at an Efficiency Grade of <strong>${grade.grade}</strong> with a Health Score of <strong>${healthScore}/100</strong>.
        The overall risk posture is classified as <strong>${risk.level}</strong>.
        Based on your current ${arch.label} architecture and <strong>${total}</strong>-person team at the <strong>${stage.label}</strong> stage,
        we estimate a Monthly Cost of Delay of <strong>${fmt(financials.monthlyTotalCOD)}</strong>,
        compounding to <strong>${fmt(financials.annualCOD)}</strong> annualised if nothing changes.`
    });

    /* Technical Debt */
    const debtPct = Math.round(arch.debtRatio * 100);
    sections.push({
        title: '🏗️ Technical Debt Analysis',
        content: `Your codebase carries an estimated <strong>${debtPct}% technical debt ratio</strong>.
        This means ${debtPct}% of engineering effort is absorbed by legacy issues rather than new value.
        <br><br>
        <strong>Bug rate:</strong> ~${Math.round(arch.bugRate * 100)}% of sprint capacity lost to defect resolution.<br>
        <strong>Maintenance overhead:</strong> ${Math.round(arch.maintenanceCost * 100)}% of monthly burn consumed.<br>
        <strong>Delivery velocity penalty:</strong> ${Math.round(arch.velocityPenalty * 100)}% slower than optimal.<br>
        <strong>Scalability ceiling:</strong> Current architecture supports ~${arch.scalabilityLimit}× current load.<br>
        <strong>Test coverage:</strong> Estimated ${Math.round(arch.testCoverage * 100)}%.<br>
        <strong>Cost to refactor now:</strong> ${fmt(financials.refactorCost)} (${arch.refactorMonths} months of team effort).
        <br><br>
        <em>Waiting 12 months to address this debt will cost an additional ${fmt(financials.recoveryPotential)} in compounding losses.</em>`
    });

    /* Team Efficiency */
    const totalEng = (t.engineers || 0) + (t.devops || 0);
    const qaRatio  = ((t.qa || 0) / Math.max(totalEng, 1) * 100).toFixed(0);
    const devRatio = ((t.devops || 0) / Math.max(total, 1) * 100).toFixed(0);
    const qaWarn   = parseInt(qaRatio) < 25 ? '⚠️ Below recommended (25–40%)' : '✅ Within range';
    const devWarn  = parseInt(devRatio) < 10 ? '⚠️ Under-resourced (<10%)' : '✅ Adequate';

    sections.push({
        title: '👥 Team Efficiency Analysis',
        content: `Team size: <strong>${total} people</strong> across ${Object.keys(t).length} roles.
        <br><br>
        <strong>QA-to-Engineering ratio:</strong> ${qaRatio}% — ${qaWarn}<br>
        <strong>DevOps coverage:</strong> ${devRatio}% of team — ${devWarn}<br>
        <strong>Project Managers:</strong> ${t.pm || 0} PM${(t.pm || 0) !== 1 ? 's' : ''} for ${totalEng} engineers.<br>
        <strong>UX/UI Designers:</strong> ${t.ux || 0} — ${(t.ux || 0) === 0 ? '⚠️ No dedicated UX creates product-market fit risk' : '✅ Present'}<br>
        <strong>Support Engineers:</strong> ${t.support || 0} — ${(t.support || 0) === 0 ? '⚠️ Customer escalation risk' : '✅ Present'}<br>
        <br>
        Burn inefficiency from team imbalance: <strong>${fmt(financials.burnInefficiency)}/month</strong>`
    });

    /* Financial Impact */
    sections.push({
        title: '💰 Financial Impact Breakdown',
        content: `<strong>Monthly Burn Rate:</strong> ${fmt(data.burnRate)}<br>
        <strong>Monthly Revenue:</strong> ${fmt(data.revenue || 0)}<br>
        <br>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Cost Category</th><th style="padding:8px;text-align:right;">Monthly</th><th style="padding:8px;text-align:right;">Annual</th></tr>
          <tr><td style="padding:8px;">Burn Inefficiency</td><td style="padding:8px;text-align:right;">${fmt(financials.burnInefficiency)}</td><td style="padding:8px;text-align:right;">${fmt(financials.burnInefficiency * 12)}</td></tr>
          <tr style="background:#fff8f8;"><td style="padding:8px;">Delivery Delay Cost</td><td style="padding:8px;text-align:right;">${fmt(financials.delayCost)}</td><td style="padding:8px;text-align:right;">${fmt(financials.delayCost * 12)}</td></tr>
          <tr><td style="padding:8px;">Lost Revenue Opportunity</td><td style="padding:8px;text-align:right;">${fmt(financials.lostOpportunity)}</td><td style="padding:8px;text-align:right;">${fmt(financials.lostOpportunity * 12)}</td></tr>
          <tr style="background:#fff3e0;font-weight:bold;"><td style="padding:8px;">Total Cost of Delay</td><td style="padding:8px;text-align:right;">${fmt(financials.monthlyTotalCOD)}</td><td style="padding:8px;text-align:right;">${fmt(financials.annualCOD)}</td></tr>
          <tr style="background:#ffebee;"><td style="padding:8px;">Security Risk (Expected)</td><td colspan="2" style="padding:8px;text-align:right;">${fmt(financials.securityRiskCost)} /year</td></tr>
          <tr style="background:#e8f5e9;"><td style="padding:8px;">Valuation at Risk (Next Round)</td><td colspan="2" style="padding:8px;text-align:right;">${fmt(financials.valuationAtRisk)}</td></tr>
        </table>`
    });

    /* Risk Assessment */
    const risks = [];
    if (arch.debtRatio > 0.50) risks.push({ name: 'Codebase Collapse', severity: 'Critical', detail: 'High debt ratio creates cascading failure risk under load.' });
    if (arch.securityRisk > 0.60) risks.push({ name: 'Security Breach', severity: 'High', detail: `${Math.round(arch.securityRisk * 100)}% risk profile — unpatched surface area.` });
    if ((t.qa || 0) === 0) risks.push({ name: 'Quality Crisis', severity: 'High', detail: 'No QA means defects ship directly to production.' });
    if ((t.devops || 0) === 0) risks.push({ name: 'Deployment Paralysis', severity: 'Medium', detail: 'No DevOps → manual deploys, no rollback, downtime risk.' });
    if (stage.marketWindowMonths <= 9) risks.push({ name: 'Market Window Closure', severity: 'High', detail: `At ${stage.label}, you have ~${stage.marketWindowMonths} months before the market window narrows.` });
    if (arch.scalabilityLimit < 5) risks.push({ name: 'Scaling Failure', severity: 'Critical', detail: `Architecture fails at ${arch.scalabilityLimit}× current load — one viral moment kills the product.` });

    const riskRows = risks.map(r => {
        const col = r.severity === 'Critical' ? '#ffebee' : r.severity === 'High' ? '#fff3e0' : '#fffde7';
        return `<tr style="background:${col};"><td style="padding:8px;font-weight:bold;">${r.name}</td><td style="padding:8px;">${r.severity}</td><td style="padding:8px;">${r.detail}</td></tr>`;
    }).join('');

    sections.push({
        title: '⚠️ Risk Assessment',
        content: `<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Risk</th><th style="padding:8px;">Severity</th><th style="padding:8px;text-align:left;">Detail</th></tr>
          ${riskRows || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#666;">No critical risks identified — keep it up!</td></tr>'}
        </table>`
    });

    /* Recommendations */
    const recs = [];
    if (data.architecture === 'mvp_spaghetti' || data.architecture === 'early_structured') {
        recs.push('🏗️ <strong>Architecture Refactor:</strong> Begin phased migration to modular/service-oriented architecture. Estimated ROI: 3–4× velocity improvement within 6 months.');
    }
    if ((t.qa || 0) / Math.max((t.engineers || 1), 1) < 0.25) {
        recs.push('🧪 <strong>Invest in QA:</strong> Hire or contract QA engineers to reach a 1:3 QA-to-engineer ratio. Implement automated test suites targeting 60%+ coverage.');
    }
    if (!arch.ci_cd) {
        recs.push('⚙️ <strong>Set up CI/CD Pipeline:</strong> Implement automated build, test, and deployment. This alone can recover 20–30% of velocity lost to manual processes.');
    }
    if ((t.devops || 0) === 0) {
        recs.push('☁️ <strong>DevOps Hire/Contract:</strong> At minimum, engage a DevOps consultant to set up infrastructure-as-code and monitoring.');
    }
    recs.push(`💼 <strong>SaaS Execution Audit:</strong> Book a full diagnostic session to receive a prioritised roadmap. Companies that complete this process reduce their Cost of Delay by an average of <strong>62% within 90 days</strong>.`);

    sections.push({
        title: '✅ Top Recommendations',
        content: `<ul style="list-style:none;padding:0;">${recs.map(r => `<li style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${r}</li>`).join('')}</ul>`
    });

    return sections;
}

/* ─── Master calculate() ────────────────────────────────────────────────── */

function runCalculation(formData) {
    const healthScore  = calculateHealthScore(formData);
    const financials   = calculateFinancials(formData);
    const grade        = getEfficiencyGrade(healthScore);
    const risk         = getRiskLevel(healthScore);
    const benchmark    = calculateBenchmark(healthScore, formData.stage);
    const trajectory   = calculateTrajectory(financials.monthlyTotalCOD, formData.architecture, 12);
    const auditSections = generateDetailedAudit(formData, financials, healthScore);

    return {
        healthScore,
        financials,
        grade,
        risk,
        benchmark,
        trajectory,
        auditSections,
    };
}

/* ─── Export for both browser & Odoo module ─────────────────────────────── */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runCalculation, ARCH_MATURITY, STARTUP_STAGES };
}
