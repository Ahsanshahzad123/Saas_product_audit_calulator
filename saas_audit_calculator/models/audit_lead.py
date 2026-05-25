from odoo import fields, models


class SaasAuditCrmLead(models.Model):
    _inherit = 'crm.lead'

    # ── Audit Inputs ──────────────────────────────────────────────────────
    saas_audience_type = fields.Selection([
        ('idea_personal',    'Idea + Personal Investment'),
        ('idea_funded',      'Idea + Seed / Investor Funding'),
        ('unsatisfied_team', 'Have a Dev Team — Unsatisfied with Results'),
        ('mvp_investment',   'Have MVP + Investment — Need Better Team'),
        ('mvp_ai',           'Built MVP with AI Tools — Facing Technical Issues'),
        ('non_technical',    'Non-Technical Founder — Limited Budget'),
    ], string='Audience Type')

    saas_type = fields.Selection([
        ('b2b',         'B2B SaaS (Business clients)'),
        ('b2c',         'B2C / Consumer SaaS'),
        ('marketplace', 'Marketplace / Platform'),
        ('enterprise',  'Enterprise Software'),
    ], string='SaaS Type')

    saas_complexity = fields.Selection([
        ('mvp',        'Simple MVP'),
        ('standard',   'Standard SaaS'),
        ('complex',    'Complex Platform'),
        ('enterprise', 'Enterprise-grade'),
    ], string='Product Complexity')

    saas_target_users = fields.Selection([
        ('small',  '< 500 users'),
        ('medium', '500 – 5,000 users'),
        ('large',  '5K – 50K users'),
        ('xlarge', '50,000+ users'),
    ], string='Target User Scale')

    saas_launch_timeline = fields.Selection([
        ('asap',   'ASAP (< 3 months)'),
        ('short',  '3 – 6 months'),
        ('medium', '6 – 12 months'),
        ('long',   '12+ months'),
    ], string='Desired Launch Timeline')

    saas_ai_type = fields.Selection([
        ('no_ai',     'No AI features'),
        ('ai_api',    'AI via API (OpenAI, Claude…)'),
        ('ai_custom', 'Custom ML model'),
        ('ai_core',   'AI-powered core product'),
    ], string='AI / Technology Type')

    saas_industry = fields.Selection([
        ('general',    'General / Other'),
        ('ecommerce',  'E-commerce / Retail'),
        ('hr_ops',     'HR / Operations'),
        ('education',  'Education / EdTech'),
        ('legal',      'Legal / LegalTech'),
        ('healthcare', 'Healthcare / MedTech (HIPAA)'),
        ('fintech',    'Finance / Fintech (PCI, SOC 2)'),
    ], string='Industry / Compliance')

    saas_role      = fields.Char('Role / Title')
    saas_challenge = fields.Text('Biggest Challenge')

    # ── Lead Classification ───────────────────────────────────────────────
    saas_lead_type = fields.Selection([
        ('calculator',    'Calculator Result'),
        ('audit_request', 'Full Audit Request'),
    ], string='SaaS Lead Type', default='calculator', index=True)

    saas_source = fields.Char('Calculator Source', default='saas_audit_calculator')

    # ── Financial Inputs ──────────────────────────────────────────────────
    saas_currency_id = fields.Many2one(
        'res.currency', string='Currency',
        default=lambda self: self.env.company.currency_id,
    )
    saas_revenue_goal = fields.Monetary('Target Annual Revenue (Year 1)', currency_field='saas_currency_id')
    saas_budget       = fields.Monetary('Available Development Budget',   currency_field='saas_currency_id')

    # ── Audit Results ─────────────────────────────────────────────────────
    saas_opportunity_score      = fields.Integer('Opportunity Score (0–100)')
    saas_monthly_rev_lost       = fields.Monetary('Monthly Revenue at Risk',       currency_field='saas_currency_id')
    saas_loss_6_months          = fields.Monetary('Loss if Delayed 6 Months',      currency_field='saas_currency_id')
    saas_loss_12_months         = fields.Monetary('Loss if Delayed 12 Months',     currency_field='saas_currency_id')
    saas_monthly_build_min      = fields.Monetary('Monthly Build Cost — Min',      currency_field='saas_currency_id')
    saas_monthly_build_max      = fields.Monetary('Monthly Build Cost — Max',      currency_field='saas_currency_id')
    saas_total_budget_min       = fields.Monetary('Total Project Budget — Min',    currency_field='saas_currency_id')
    saas_total_budget_max       = fields.Monetary('Total Project Budget — Max',    currency_field='saas_currency_id')
    saas_roi_months             = fields.Integer('Estimated Break-even (months)')
    saas_build_timeline         = fields.Integer('Estimated Build Timeline (months)')
    saas_verdict                = fields.Char('Opportunity Verdict')
    saas_team_size              = fields.Char('Recommended Team Size')
    saas_ip_address             = fields.Char('IP Address')
